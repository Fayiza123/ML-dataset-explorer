from __future__ import annotations

import csv
import os
import sqlite3
from contextlib import closing
from datetime import datetime
from io import StringIO
from pathlib import Path
from typing import Any, Literal, Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "datasets.db"

DatasetType = Literal["Tabular", "Image", "Text", "Audio"]
DatasetStatus = Literal["Not Explored", "Exploring", "Ready for Training", "Trained"]


class DatasetBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)
    type: DatasetType
    rows: int = Field(ge=0)
    features: int = Field(ge=0)
    status: DatasetStatus = "Not Explored"


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(BaseModel):
    description: Optional[str] = Field(default=None, min_length=1, max_length=500)
    type: Optional[DatasetType] = None
    rows: Optional[int] = Field(default=None, ge=0)
    features: Optional[int] = Field(default=None, ge=0)
    status: Optional[DatasetStatus] = None


class DatasetResponse(DatasetBase):
    id: int


class DatasetStats(BaseModel):
    total_datasets: int
    tabular_datasets: int
    image_datasets: int
    text_datasets: int
    audio_datasets: int


app = FastAPI(title="Machine Learning Dataset Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with closing(get_connection()) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                type TEXT NOT NULL,
                rows INTEGER NOT NULL,
                features INTEGER NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()

        cursor = connection.execute("SELECT COUNT(*) AS count FROM datasets")
        count = cursor.fetchone()["count"]
        if count == 0:
            seed_datasets = [
                ("Iris Dataset", "Flower classification dataset", "Tabular", 150, 4, "Ready for Training"),
                ("Cats vs Dogs", "Image classification starter dataset", "Image", 25000, 1, "Exploring"),
                ("Sentiment Reviews", "Movie review sentiment dataset", "Text", 50000, 2, "Not Explored"),
            ]
            connection.executemany(
                """
                INSERT INTO datasets (name, description, type, rows, features, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                seed_datasets,
            )
            connection.commit()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def row_to_dataset(row: sqlite3.Row) -> DatasetResponse:
    return DatasetResponse(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        type=row["type"],
        rows=row["rows"],
        features=row["features"],
        status=row["status"],
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/datasets", response_model=list[DatasetResponse])
def get_datasets(search: str | None = Query(default=None, min_length=1)) -> list[DatasetResponse]:
    with closing(get_connection()) as connection:
        if search:
            rows = connection.execute(
                """
                SELECT * FROM datasets
                WHERE LOWER(name) LIKE LOWER(?)
                ORDER BY id DESC
                """,
                (f"%{search}%",),
            ).fetchall()
        else:
            rows = connection.execute("SELECT * FROM datasets ORDER BY id DESC").fetchall()
        return [row_to_dataset(row) for row in rows]


@app.get("/datasets/{dataset_id:int}", response_model=DatasetResponse)
def get_dataset(dataset_id: int) -> DatasetResponse:
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return row_to_dataset(row)


@app.post("/datasets", response_model=DatasetResponse, status_code=201)
def create_dataset(dataset: DatasetCreate) -> DatasetResponse:
    with closing(get_connection()) as connection:
        cursor = connection.execute(
            """
            INSERT INTO datasets (name, description, type, rows, features, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (dataset.name, dataset.description, dataset.type, dataset.rows, dataset.features, dataset.status),
        )
        connection.commit()
        row = connection.execute("SELECT * FROM datasets WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return row_to_dataset(row)


@app.put("/datasets/{dataset_id:int}", response_model=DatasetResponse)
def update_dataset(dataset_id: int, dataset: DatasetUpdate) -> DatasetResponse:
    if dataset.model_dump(exclude_unset=True) == {}:
        raise HTTPException(status_code=400, detail="At least one field is required for update")

    with closing(get_connection()) as connection:
        row = connection.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Dataset not found")

        current = dict(row)
        updates = dataset.model_dump(exclude_unset=True)
        current.update(updates)
        connection.execute(
            """
            UPDATE datasets
            SET description = ?, type = ?, rows = ?, features = ?, status = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                current["description"],
                current["type"],
                current["rows"],
                current["features"],
                current["status"],
                datetime.utcnow().isoformat(),
                dataset_id,
            ),
        )
        connection.commit()
        updated_row = connection.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        return row_to_dataset(updated_row)


@app.delete("/datasets/{dataset_id:int}")
def delete_dataset(dataset_id: int) -> dict[str, str]:
    with closing(get_connection()) as connection:
        cursor = connection.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        connection.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"message": "Dataset deleted successfully"}


@app.get("/datasets/stats", response_model=DatasetStats)
def get_dataset_stats() -> DatasetStats:
    with closing(get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT
                COUNT(*) AS total_datasets,
                SUM(CASE WHEN type = 'Tabular' THEN 1 ELSE 0 END) AS tabular_datasets,
                SUM(CASE WHEN type = 'Image' THEN 1 ELSE 0 END) AS image_datasets,
                SUM(CASE WHEN type = 'Text' THEN 1 ELSE 0 END) AS text_datasets,
                SUM(CASE WHEN type = 'Audio' THEN 1 ELSE 0 END) AS audio_datasets
            FROM datasets
            """
        ).fetchone()
        return DatasetStats(
            total_datasets=rows["total_datasets"] or 0,
            tabular_datasets=rows["tabular_datasets"] or 0,
            image_datasets=rows["image_datasets"] or 0,
            text_datasets=rows["text_datasets"] or 0,
            audio_datasets=rows["audio_datasets"] or 0,
        )


@app.post("/datasets/upload-csv", response_model=DatasetResponse, status_code=201)
async def upload_csv(
    file: UploadFile = File(...),
    name: str = Query(..., min_length=1),
    description: str = Query(default="CSV dataset uploaded by user", min_length=1),
    type: DatasetType = Query(default="Tabular"),
    status: DatasetStatus = Query(default="Not Explored"),
) -> DatasetResponse:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    contents = await file.read()
    try:
        dataframe = pd.read_csv(StringIO(contents.decode("utf-8")))
    except Exception as exc:  # pragma: no cover - handled as API error
        raise HTTPException(status_code=400, detail=f"Unable to read CSV: {exc}") from exc

    dataset = DatasetCreate(
        name=name,
        description=description,
        type=type,
        rows=int(dataframe.shape[0]),
        features=int(dataframe.shape[1]),
        status=status,
    )
    return create_dataset(dataset)
