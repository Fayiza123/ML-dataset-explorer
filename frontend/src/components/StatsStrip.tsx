import type { DatasetStats } from '../types';

interface StatsStripProps {
  stats: DatasetStats | null;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function StatsStrip({ stats }: StatsStripProps) {
  const safeStats = stats ?? {
    total_datasets: 0,
    tabular_datasets: 0,
    image_datasets: 0,
    text_datasets: 0,
    audio_datasets: 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard label="Total" value={safeStats.total_datasets} />
      <MetricCard label="Tabular" value={safeStats.tabular_datasets} />
      <MetricCard label="Image" value={safeStats.image_datasets} />
      <MetricCard label="Text" value={safeStats.text_datasets} />
      <MetricCard label="Audio" value={safeStats.audio_datasets} />
    </div>
  );
}
