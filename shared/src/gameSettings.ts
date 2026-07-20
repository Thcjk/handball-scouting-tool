/** Spielgeschwindigkeit & Einstellungen */

export type GameSpeed = 'pause' | 'normal' | 'fast' | 'very_fast';

export interface GameSettings {
  speed: GameSpeed;
  showTooltips: boolean;
  tutorialHints: boolean;
}

export const SPEED_LABEL: Record<GameSpeed, string> = {
  pause: 'Pause',
  normal: 'Normal',
  fast: 'Schnell',
  very_fast: 'Sehr schnell',
};

/** Mindestabstand zwischen Ticks in ms */
export function tickIntervalMs(speed: GameSpeed): number {
  switch (speed) {
    case 'pause':
      return Number.POSITIVE_INFINITY;
    case 'normal':
      return 25000;
    case 'fast':
      return 12000;
    case 'very_fast':
      return 5000;
  }
}

/** UI-Poll-Intervall */
export function uiPollIntervalMs(speed: GameSpeed): number {
  switch (speed) {
    case 'pause':
      return 60000;
    case 'normal':
      return 30000;
    case 'fast':
      return 15000;
    case 'very_fast':
      return 6000;
  }
}

export function defaultGameSettings(): GameSettings {
  return { speed: 'normal', showTooltips: true, tutorialHints: true };
}
