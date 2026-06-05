# Machine Learning Dataset Explorer

A beginner-friendly full-stack project for exploring CRUD operations, REST APIs, and basic machine learning dataset metadata.

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS v3, Axios, Vite
- Backend: FastAPI, Pydantic, Uvicorn, SQLite, Pandas

## Features

- Create datasets with name, description, type, row count, feature count, and status
- View datasets in a responsive card layout
- Update dataset metadata and status
- Delete datasets
- Search datasets by name
- View dataset statistics
- Upload a CSV file and automatically detect rows and columns

## Project Structure

- `backend/` FastAPI application and SQLite database
- `frontend/` React + TypeScript + Tailwind application
- `ml-dataset-explorer.code-workspace` workspace file for VS Code

## Setup Instructions

### 1. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

The UI runs at `http://localhost:5173` and connects to the backend at `http://localhost:8000` by default.

If you want to point the frontend at a different backend URL, create a `.env` file in `frontend/` and set:

```env
VITE_API_URL=http://localhost:8000
```

## API Documentation

### Health Check

- `GET /health`

### Dataset Endpoints

- `GET /datasets` - Get all datasets
- `GET /datasets?search=iris` - Search datasets by name
- `GET /datasets/{id}` - Get a dataset by ID
- `POST /datasets` - Create a dataset
- `PUT /datasets/{id}` - Update a dataset
- `DELETE /datasets/{id}` - Delete a dataset
- `GET /datasets/stats` - Get dataset statistics
- `POST /datasets/upload-csv` - Upload a CSV file and create a dataset from it

### Create Dataset Example

```json
{
  "name": "Iris Dataset",
  "description": "Flower classification dataset",
  "type": "Tabular",
  "rows": 150,
  "features": 4,
  "status": "Ready for Training"
}
```

### Sample Response

```json
{
  "id": 1,
  "name": "Iris Dataset",
  "description": "Flower classification dataset",
  "type": "Tabular",
  "rows": 150,
  "features": 4,
  "status": "Ready for Training"
}
```

## Screenshots

<img width="1366" height="768" alt="Screenshot (23)" src="https://github.com/user-attachments/assets/29b88257-1f42-4da3-9497-0a65ef5dc122" />
<img width="1366" height="768" alt="Screenshot (24)" src="https://github.com/user-attachments/assets/1ada6b28-87c2-4fc0-95ae-c7c3ce5f23a1" />
<img width="1366" height="768" alt="Screenshot (25)" src="https://github.com/user-attachments/assets/b6305b01-e418-41d1-ab65-5162fed2379a" />
<img width="1366" height="768" alt="Screenshot (26)" src="https://github.com/user-attachments/assets/0c3f19f0-5471-4c30-aa05-9c83bf5a6f3b" />



## Learning Notes

This project demonstrates:

- React components, props, and hooks
- State updates and UI re-rendering
- REST API requests and responses
- FastAPI routing and request validation
- Full-stack data flow with Axios
- Basic dataset analysis concepts
