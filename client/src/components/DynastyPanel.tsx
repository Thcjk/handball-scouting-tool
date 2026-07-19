import type { DynastyInfo } from '../api/client';

export default function DynastyPanel({ dynasty }: { dynasty: DynastyInfo }) {
  return (
    <div className="card">
      <h3 className="font-bold text-medieval-gold mb-3">
        Dynastie {dynasty.dynasty?.name ?? ''}
        {dynasty.dynasty?.motto && (
          <span className="text-sm text-gray-400 font-normal ml-2">„{dynasty.dynasty.motto}"</span>
        )}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dynasty.ruler && (
          <div className="bg-medieval-dark p-3 rounded border border-medieval-gold/30">
            <div className="text-xs text-medieval-gold mb-1">👑 Herrscher</div>
            <div className="font-semibold">{dynasty.ruler.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              Alter: {dynasty.ruler.age} · Kampf: {dynasty.ruler.martial} · Diplomatie:{' '}
              {dynasty.ruler.diplomacy}
            </div>
          </div>
        )}

        {dynasty.heir && (
          <div className="bg-medieval-dark p-3 rounded border border-medieval-brown/30">
            <div className="text-xs text-medieval-light mb-1">🎖️ Erbe</div>
            <div className="font-semibold">{dynasty.heir.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              Alter: {dynasty.heir.age} · Kampf: {dynasty.heir.martial}
            </div>
          </div>
        )}
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
