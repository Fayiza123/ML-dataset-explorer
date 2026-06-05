import axios from 'axios';
import type { Dataset, DatasetFormValues, DatasetStats, DatasetStatus, DatasetType } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
});

export function getDatasets(search?: string) {
  return api.get<Dataset[]>('/datasets', {
    params: search ? { search } : undefined,
  });
}

export function getDataset(id: number) {
  return api.get<Dataset>(`/datasets/${id}`);
}

export function createDataset(payload: DatasetFormValues) {
  return api.post<Dataset>('/datasets', payload);
}

export function updateDataset(id: number, payload: Partial<DatasetFormValues>) {
  return api.put<Dataset>(`/datasets/${id}`, payload);
}

export function deleteDataset(id: number) {
  return api.delete<{ message: string }>(`/datasets/${id}`);
}

export function getDatasetStats() {
  return api.get<DatasetStats>('/datasets/stats');
}

export function uploadCsv(payload: {
  file: File;
  name: string;
  description: string;
  type: DatasetType;
  status: DatasetStatus;
}) {
  const formData = new FormData();
  formData.append('file', payload.file);

  return api.post<Dataset>('/datasets/upload-csv', formData, {
    params: {
      name: payload.name,
      description: payload.description,
      type: payload.type,
      status: payload.status,
    },
  });
}
