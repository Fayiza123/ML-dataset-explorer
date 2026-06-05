export type DatasetType = 'Tabular' | 'Image' | 'Text' | 'Audio';
export type DatasetStatus = 'Not Explored' | 'Exploring' | 'Ready for Training' | 'Trained';

export interface Dataset {
  id: number;
  name: string;
  description: string;
  type: DatasetType;
  rows: number;
  features: number;
  status: DatasetStatus;
}

export interface DatasetFormValues {
  name: string;
  description: string;
  type: DatasetType;
  rows: number;
  features: number;
  status: DatasetStatus;
}

export interface DatasetStats {
  total_datasets: number;
  tabular_datasets: number;
  image_datasets: number;
  text_datasets: number;
  audio_datasets: number;
}
