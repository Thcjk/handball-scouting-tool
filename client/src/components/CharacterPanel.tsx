import type { DynastyInfo } from '../api/client';

const TRAIT_LABELS: Record<string, string> = {
  mutig: 'Mutig',
  gerecht: 'Gerecht',
  grausam: 'Grausam',
  ehrlich: 'Ehrlich',
  gierig: 'Gierig',
  intelligent: 'Intelligent',
  charismatisch: 'Charismatisch',
  ehrgeizig: 'Ehrgeizig',
  loyal: 'Loyal',
  listig: 'Listig',
  tapfer: 'Tapfer',
  fromm: 'Fromm',
};

interface Props {
  dynasty: DynastyInfo;
  compact?: boolean;
  onClose?: () => void;
}

export default function CharacterPanel({ dynasty, compact, onClose }: Props) {
  const ruler = dynasty.ruler;
  if (!ruler) return null;

  return (
    <div className="panel p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="panel-header !mb-0 !pb-0 !border-0 flex-1">
          {dynasty.dynasty?.name ?? 'Dynastie'}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary text-[10px] py-0.5 px-1.5">
            ✕
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="portrait-frame" title={ruler.name}>
          👑
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-gold text-sm leading-tight">{ruler.name}</div>
          <div className="text-[11px] text-parchment/60 mt-0.5">
            Herrscher · {ruler.age} Jahre
            {ruler.gender === 'FEMALE' ? ' · Weiblich' : ' · Männlich'}
          </div>
          {dynasty.dynasty?.motto && (
            <div className="text-[10px] italic text-parchment/50 mt-1">„{dynasty.dynasty.motto}"</div>
          )}
          {ruler.traits && ruler.traits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ruler.traits.map((t) => (
                <span key={t} className="trait-chip">
                  {TRAIT_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-0.5">
        <div className="stat-row">
          <span>⚔️ Kriegskunst</span>
          <span className="text-gold">{ruler.martial}</span>
        </div>
        <div className="stat-row">
          <span>🤝 Diplomatie</span>
          <span className="text-gold">{ruler.diplomacy}</span>
        </div>
        <div className="stat-row">
          <span>📜 Verwaltung</span>
          <span className="text-gold">{ruler.stewardship}</span>
        </div>
        <div className="stat-row">
          <span>🕵️ Intrige</span>
          <span className="text-gold">{ruler.intrigue ?? 5}</span>
        </div>
        {(ruler.health !== undefined || ruler.prestige !== undefined) && (
          <div className="stat-row">
            <span>❤️ Gesundheit / Prestige</span>
            <span className="text-gold">
              {ruler.health ?? 100} / {ruler.prestige ?? 0}
            </span>
          </div>
        )}
      </div>

      {dynasty.heir && !compact && (
        <div className="mt-3 pt-2 border-t border-gold/20">
          <div className="text-[10px] text-parchment/50 font-display mb-1">Erbe</div>
          <div className="flex items-center gap-2">
            <div className="portrait-frame !w-10 !h-12 !text-base">🎖️</div>
            <div>
              <div className="text-sm font-display">{dynasty.heir.name}</div>
              <div className="text-[10px] text-parchment/50">
                {dynasty.heir.age} Jahre · Krieg {dynasty.heir.martial}
              </div>
            </div>
          </div>
        </div>
      )}

      {dynasty.heir && compact && (
        <div className="mt-2 text-[11px] text-parchment/60">
          Erbe: <span className="text-parchment">{dynasty.heir.name}</span> ({dynasty.heir.age})
        </div>
      )}
    </div>
  );
}
