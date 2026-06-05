import { useEffect, useState, type FormEvent } from 'react';
import { createDataset, deleteDataset, getDatasetStats, getDatasets, updateDataset, uploadCsv } from './api';
import { DatasetCard } from './components/DatasetCard';
import { StatsStrip } from './components/StatsStrip';
import type { Dataset, DatasetFormValues, DatasetStatus, DatasetStats, DatasetType } from './types';

const emptyForm: DatasetFormValues = {
  name: '',
  description: '',
  type: 'Tabular',
  rows: 1,
  features: 1,
  status: 'Not Explored',
};

const emptyUpload = {
  name: '',
  description: 'CSV dataset uploaded by user',
  type: 'Tabular' as DatasetType,
  status: 'Not Explored' as DatasetStatus,
};

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DatasetFormValues>(emptyForm);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState(emptyUpload);

  const activeSearch = search.trim() || undefined;

  async function refreshData(searchTerm?: string) {
    setLoading(true);
    try {
      const [datasetResponse, statsResponse] = await Promise.all([
        getDatasets(searchTerm),
        getDatasetStats(),
      ]);
      setDatasets(datasetResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load datasets';
      setFeedback({ kind: 'error', text: message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshData(activeSearch);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeSearch]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleEdit(dataset: Dataset) {
    setEditingId(dataset.id);
    setForm({
      name: dataset.name,
      description: dataset.description,
      type: dataset.type,
      rows: dataset.rows,
      features: dataset.features,
      status: dataset.status,
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingId === null) {
        await createDataset(form);
        setFeedback({ kind: 'success', text: 'Dataset created successfully.' });
      } else {
        await updateDataset(editingId, {
          description: form.description,
          type: form.type,
          rows: form.rows,
          features: form.features,
          status: form.status,
        });
        setFeedback({ kind: 'success', text: 'Dataset updated successfully.' });
      }

      resetForm();
      await refreshData(activeSearch);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save dataset';
      setFeedback({ kind: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const shouldDelete = window.confirm('Delete this dataset? This cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteDataset(id);
      setFeedback({ kind: 'success', text: 'Dataset removed successfully.' });
      if (editingId === id) {
        resetForm();
      }
      await refreshData(activeSearch);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete dataset';
      setFeedback({ kind: 'error', text: message });
    }
  }

  async function handleStatusChange(id: number, status: DatasetStatus) {
    try {
      await updateDataset(id, { status });
      setFeedback({ kind: 'success', text: 'Status updated successfully.' });
      await refreshData(activeSearch);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update status';
      setFeedback({ kind: 'error', text: message });
    }
  }

  async function handleUploadCsv(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!csvFile) {
      setFeedback({ kind: 'error', text: 'Choose a CSV file before uploading.' });
      return;
    }

    if (!uploadForm.name.trim()) {
      setFeedback({ kind: 'error', text: 'Enter a name for the uploaded dataset.' });
      return;
    }

    setUploading(true);
    try {
      await uploadCsv({
        file: csvFile,
        name: uploadForm.name.trim(),
        description: uploadForm.description.trim() || 'CSV dataset uploaded by user',
        type: uploadForm.type,
        status: uploadForm.status,
      });
      setFeedback({ kind: 'success', text: 'CSV uploaded and analyzed successfully.' });
      setCsvFile(null);
      setUploadForm(emptyUpload);
      await refreshData(activeSearch);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload CSV';
      setFeedback({ kind: 'error', text: message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_30%),linear-gradient(180deg,#020617_0%,#081120_55%,#020617_100%)] text-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Machine Learning Dataset Explorer</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Explore, track, and prepare datasets for training.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                This beginner-friendly dashboard demonstrates React state, FastAPI CRUD endpoints, and the basic metadata behind machine learning datasets.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">Backend</span>
                <span className="mt-1 block text-white">FastAPI + SQLite</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">Frontend</span>
                <span className="mt-1 block text-white">React + TypeScript</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">Styling</span>
                <span className="mt-1 block text-white">Tailwind CSS v3</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <StatsStrip stats={stats} />
          </div>

          {feedback && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                feedback.kind === 'success'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                  : 'border-rose-400/30 bg-rose-500/10 text-rose-100'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  {editingId === null ? 'Create Dataset' : `Editing Dataset #${editingId}`}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Dataset details</h2>
              </div>
              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-300">Dataset Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Iris Dataset"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-300">Description</span>
                <textarea
                  required
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Flower classification dataset"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Dataset Type</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value as DatasetType })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                >
                  <option>Tabular</option>
                  <option>Image</option>
                  <option>Text</option>
                  <option>Audio</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as DatasetStatus })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                >
                  <option>Not Explored</option>
                  <option>Exploring</option>
                  <option>Ready for Training</option>
                  <option>Trained</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Number of Rows</span>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.rows}
                  onChange={(event) => setForm({ ...form, rows: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Number of Features</span>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.features}
                  onChange={(event) => setForm({ ...form, features: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 inline-flex items-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingId === null ? 'Create Dataset' : 'Update Dataset'}
            </button>
          </form>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Search</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Find datasets fast</h2>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Search by dataset name, like iris"
              />
              <p className="mt-3 text-sm text-slate-400">The list updates as you type.</p>
            </section>

            <form onSubmit={handleUploadCsv} className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">CSV Upload</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Analyze a CSV file</h2>
              <div className="mt-5 space-y-4">
                <label className="space-y-2 block">
                  <span className="text-sm font-medium text-slate-300">Dataset Name</span>
                  <input
                    required
                    value={uploadForm.name}
                    onChange={(event) => setUploadForm({ ...uploadForm, name: event.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    placeholder="Customer churn data"
                  />
                </label>

                <label className="space-y-2 block">
                  <span className="text-sm font-medium text-slate-300">Description</span>
                  <input
                    value={uploadForm.description}
                    onChange={(event) => setUploadForm({ ...uploadForm, description: event.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    placeholder="Imported from a local CSV file"
                  />
                </label>

                <label className="space-y-2 block">
                  <span className="text-sm font-medium text-slate-300">CSV File</span>
                  <input
                    required
                    type="file"
                    accept=".csv"
                    onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 block">
                    <span className="text-sm font-medium text-slate-300">Type</span>
                    <select
                      value={uploadForm.type}
                      onChange={(event) => setUploadForm({ ...uploadForm, type: event.target.value as DatasetType })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    >
                      <option>Tabular</option>
                      <option>Image</option>
                      <option>Text</option>
                      <option>Audio</option>
                    </select>
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-sm font-medium text-slate-300">Status</span>
                    <select
                      value={uploadForm.status}
                      onChange={(event) => setUploadForm({ ...uploadForm, status: event.target.value as DatasetStatus })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    >
                      <option>Not Explored</option>
                      <option>Exploring</option>
                      <option>Ready for Training</option>
                      <option>Trained</option>
                    </select>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="mt-6 inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </form>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Dataset Gallery</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">All datasets</h2>
            </div>
            <p className="text-sm text-slate-400">{datasets.length} dataset{datasets.length === 1 ? '' : 's'} shown</p>
          </div>

          {loading ? (
            <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 text-slate-300 shadow-glow">
              Loading datasets...
            </div>
          ) : datasets.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 text-slate-300 shadow-glow">
              No datasets match your search.
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {datasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
