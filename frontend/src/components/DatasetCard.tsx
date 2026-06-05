import type { Dataset, DatasetStatus } from '../types';

interface DatasetCardProps {
  dataset: Dataset;
  onEdit: (dataset: Dataset) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: DatasetStatus) => void;
}

const badgeStyles: Record<Dataset['type'], string> = {
  Tabular: 'bg-sky-500/15 text-sky-200 ring-sky-400/30',
  Image: 'bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30',
  Text: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
  Audio: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
};

export function DatasetCard({ dataset, onEdit, onDelete, onStatusChange }: DatasetCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-glow transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ring-1 ${badgeStyles[dataset.type]}`}>
            {dataset.type}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-white">{dataset.name}</h3>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10">
          #{dataset.id}
        </span>
      </div>

      <p className="mt-4 min-h-[3rem] text-sm leading-6 text-slate-300">{dataset.description}</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/8">
          <dt className="text-slate-400">Rows</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{dataset.rows.toLocaleString()}</dd>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/8">
          <dt className="text-slate-400">Features</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{dataset.features.toLocaleString()}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</label>
        <select
          value={dataset.status}
          onChange={(event) => onStatusChange(dataset.id, event.target.value as DatasetStatus)}
          className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
        >
          <option>Not Explored</option>
          <option>Exploring</option>
          <option>Ready for Training</option>
          <option>Trained</option>
        </select>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => onEdit(dataset)}
          className="flex-1 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(dataset.id)}
          className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
