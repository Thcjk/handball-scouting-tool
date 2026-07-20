import type { Resources } from '../api/client';

const RESOURCE_LABELS: Array<{ key: keyof Resources; label: string; icon: string }> = [
  { key: 'gold', label: 'Gold', icon: '🪙' },
  { key: 'food', label: 'Nahrung', icon: '🌾' },
  { key: 'wood', label: 'Holz', icon: '🪵' },
  { key: 'stone', label: 'Stein', icon: '🪨' },
  { key: 'iron', label: 'Eisen', icon: '⚒️' },
  { key: 'influence', label: 'Einfluss', icon: '👑' },
  { key: 'fame', label: 'Ruhm', icon: '⭐' },
];

export default function ResourceBar({ resources }: { resources: Resources }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {RESOURCE_LABELS.map(({ key, label, icon }) => (
        <span key={key} className="resource-badge" title={label}>
          <span>{icon}</span>
          <span className="font-semibold text-gold tabular-nums">{resources[key] ?? 0}</span>
        </span>
      ))}
    </div>
  );
}
