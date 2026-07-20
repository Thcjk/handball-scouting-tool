/**
 * Mehrfach-Spielstände, Autosave, Quicksave – Phase 5.3
 * Robuste localStorage-Zugriffe mit Backup-Kopie.
 */

const SLOT_INDEX_KEY = 'kronenchronik_save_slots';
const AUTOSAVE_SUFFIX = '_autosave';
const QUICKSAVE_SUFFIX = '_quick';
const BACKUP_SUFFIX = '_bak';

export type SaveSlotMeta = {
  id: string;
  name: string;
  updatedAt: number;
  kingdomName?: string;
  tickCount?: number;
  year?: number;
};

function slotKey(userId: string, slotId: string) {
  return `kronenchronik_slot_${userId}_${slotId}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function listSaveSlots(userId: string): SaveSlotMeta[] {
  const all = safeParse<Record<string, SaveSlotMeta[]>>(localStorage.getItem(SLOT_INDEX_KEY), {});
  return all[userId] ?? [];
}

function writeSlotIndex(userId: string, slots: SaveSlotMeta[]) {
  const all = safeParse<Record<string, SaveSlotMeta[]>>(localStorage.getItem(SLOT_INDEX_KEY), {});
  all[userId] = slots.slice(0, 12);
  localStorage.setItem(SLOT_INDEX_KEY, JSON.stringify(all));
}

/** Speichert JSON mit Backup der vorherigen Version */
export function writeSaveBlob(key: string, data: unknown): void {
  try {
    const prev = localStorage.getItem(key);
    if (prev) localStorage.setItem(key + BACKUP_SUFFIX, prev);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Kronenchronik] Speichern fehlgeschlagen', e);
    throw new Error('Speichern fehlgeschlagen – Speicher voll oder blockiert');
  }
}

export function readSaveBlob<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('[Kronenchronik] Spielstand beschädigt, versuche Backup', e);
    try {
      const bak = localStorage.getItem(key + BACKUP_SUFFIX);
      if (bak) return JSON.parse(bak) as T;
    } catch (e2) {
      console.error('[Kronenchronik] Backup ebenfalls ungültig', e2);
    }
  }
  return null;
}

export function saveToNamedSlot(
  userId: string,
  slotName: string,
  save: unknown,
  meta: { kingdomName: string; tickCount: number; year: number },
): SaveSlotMeta {
  const id = `slot_${Date.now().toString(36)}`;
  writeSaveBlob(slotKey(userId, id), save);
  const entry: SaveSlotMeta = {
    id,
    name: slotName || `Spielstand ${new Date().toLocaleString('de-DE')}`,
    updatedAt: Date.now(),
    kingdomName: meta.kingdomName,
    tickCount: meta.tickCount,
    year: meta.year,
  };
  const slots = [entry, ...listSaveSlots(userId).filter((s) => s.name !== entry.name)];
  writeSlotIndex(userId, slots);
  return entry;
}

export function loadNamedSlot<T>(userId: string, slotId: string): T | null {
  return readSaveBlob<T>(slotKey(userId, slotId));
}

export function deleteNamedSlot(userId: string, slotId: string): void {
  localStorage.removeItem(slotKey(userId, slotId));
  localStorage.removeItem(slotKey(userId, slotId) + BACKUP_SUFFIX);
  writeSlotIndex(
    userId,
    listSaveSlots(userId).filter((s) => s.id !== slotId),
  );
}

export function quickSave(_userId: string, primaryKey: string, save: unknown): void {
  const raw = localStorage.getItem(primaryKey);
  if (raw) writeSaveBlob(primaryKey + QUICKSAVE_SUFFIX, JSON.parse(raw));
  writeSaveBlob(primaryKey, save);
}

export function quickLoad<T>(_userId: string, primaryKey: string): T | null {
  return readSaveBlob<T>(primaryKey + QUICKSAVE_SUFFIX);
}

export function autoSave(_userId: string, primaryKey: string, save: unknown): void {
  try {
    writeSaveBlob(primaryKey + AUTOSAVE_SUFFIX, save);
  } catch (e) {
    console.warn('[Kronenchronik] Autosave fehlgeschlagen', e);
  }
}
