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

function CharacterCard({
  title,
  icon,
  character,
}: {
  title: string;
  icon: string;
  character: NonNullable<DynastyInfo['ruler']>;
}) {
  return (
    <div className="bg-medieval-dark p-3 rounded border border-medieval-gold/30">
      <div className="text-xs text-medieval-gold mb-1">
        {icon} {title}
      </div>
      <div className="font-semibold text-lg">{character.name}</div>
      <div className="text-xs text-gray-400 mt-1">
        Alter {character.age}
        {character.gender && ` · ${character.gender === 'MALE' ? 'Männlich' : 'Weiblich'}`}
      </div>
      <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
        <span>⚔️ Krieg: {character.martial}</span>
        <span>🤝 Diplomatie: {character.diplomacy}</span>
        <span>📜 Verwaltung: {character.stewardship}</span>
        <span>🕵️ Intrige: {character.intrigue ?? '–'}</span>
      </div>
      {(character.health !== undefined || character.prestige !== undefined) && (
        <div className="text-xs text-gray-400 mt-1">
          {character.health !== undefined && `❤️ ${character.health}%`}
          {character.prestige !== undefined && ` · ⭐ ${character.prestige} Prestige`}
          {character.experience !== undefined && character.experience > 0 && ` · XP ${character.experience}`}
        </div>
      )}
      {character.traits && character.traits.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {character.traits.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-medieval-brown/40 text-medieval-gold">
              {TRAIT_LABELS[t] ?? t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CharacterPanel({ dynasty }: { dynasty: DynastyInfo }) {
  return (
    <div className="card">
      <h3 className="font-bold text-medieval-gold mb-3">
        👤 Charakter & Dynastie
        {dynasty.dynasty?.motto && (
          <span className="text-sm text-gray-400 font-normal ml-2">„{dynasty.dynasty.motto}"</span>
        )}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dynasty.ruler && <CharacterCard title="Herrscher" icon="👑" character={dynasty.ruler} />}
        {dynasty.heir && <CharacterCard title="Erbe" icon="🎖️" character={dynasty.heir} />}
      </div>

      {dynasty.characters.length > 2 && (
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-1">Familie</div>
          <div className="flex flex-wrap gap-1">
            {dynasty.characters
              .filter((c) => !c.isRuler && !c.isHeir)
              .map((c) => (
                <span
                  key={c.id}
                  className={`text-xs px-2 py-1 rounded ${c.isAlive ? 'bg-medieval-dark' : 'bg-gray-800 text-gray-500 line-through'}`}
                >
                  {c.name} ({c.age})
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
