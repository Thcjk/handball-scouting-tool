import type { Resources } from '../api/client';

const RESOURCE_LABELS: Record<keyof Resources, { label: string; icon: string }> = {
  gold: { label: 'Gold', icon: '🪙' },
  food: { label: 'Nahrung', icon: '🌾' },
  wood: { label: 'Holz', icon: '🪵' },
  stone: { label: 'Stein', icon: '🪨' },
  iron: { label: 'Eisen', icon: '⚒️' },
  coal: { label: 'Kohle', icon: '⛏️' },
  influence: { label: 'Einfluss', icon: '👑' },
  fame: { label: 'Ruhm', icon: '⭐' },
};

export default function ResourceBar({ resources }: { resources: Resources }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(RESOURCE_LABELS) as Array<keyof Resources>).map((key) => (
        <span key={key} className="resource-badge">
          <span>{RESOURCE_LABELS[key].icon}</span>
          <span className="text-medieval-light">{RESOURCE_LABELS[key].label}:</span>
          <span className="font-semibold text-medieval-gold">{resources[key] ?? 0}</span>
        </span>
      ))}
    </div>
  );
}
