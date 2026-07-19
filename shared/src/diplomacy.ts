export enum DiplomaticStatus {
  NEUTRAL = 'NEUTRAL',
  ALLIED = 'ALLIED',
  AT_WAR = 'AT_WAR',
  TRADE_PACT = 'TRADE_PACT',
}

export const DIPLOMACY_COSTS = {
  declareWar: { influence: 5 },
  proposeAlliance: { influence: 15 },
  proposeTrade: { influence: 8 },
  makePeace: { influence: 10 },
};

export const ALLIANCE_BONUS = {
  defenseBonus: 0.1,
};
