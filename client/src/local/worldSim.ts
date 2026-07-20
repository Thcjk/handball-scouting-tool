/**
 * Offline-Welt-Simulation (Phase 3)
 * Spawn KI-Reiche, Tick-Züge, Belagerungen, Ereignisse, Dynastie-Alterung
 */
import {
  AI_KINGDOMS,
  BuildingType,
  PERSONALITIES,
  UnitType,
  adjustOpinion,
  areAtWar,
  createSiege,
  cryptoRandomId,
  decideAiAction,
  ensureRelation,
  evaluateSiege,
  makeChronicle,
  personalityFromTraits,
  resolveBattle,
  rollWorldEvent,
  tickSiege,
  warReasonText,
  shouldRulerDieFromAge,
  type ActiveSiege,
  type ActiveWar,
  type AiKingdomState,
  type ChronicleEntry,
  type KingdomRelation,
  type LongTermGoal,
  type PendingWorldEvent,
  type SpyMission,
  type WorldGeneral,
  type AiAction,
} from '@kronenchronik/shared';
import { Terrain } from '@kronenchronik/shared';

/** Minimale Provinz-/Armee-Form für die Simulation (kompatibel zu localApi Save*) */
export interface SimProvince {
  id: string;
  slug: string;
  name: string;
  terrain: string;
  population: number;
  prosperity: number;
  defense: number;
  ownerId: string | null;
  ownerName: string | null;
  culture?: string;
  religion?: string;
  castle: { level: number } | null;
  village: { level: number } | null;
  city: { level: number } | null;
  buildings: Array<{ id: string; type: string; level: number }>;
  neighborSlugs: string[];
  cityGrid?: unknown;
  devStats?: { satisfaction: number; stock: { bread: number }; taxRate?: number };
}

export interface SimArmy {
  id: string;
  name: string;
  provinceId: string;
  morale: number;
  isGarrison: boolean;
  kingdomId?: string;
  generalId?: string;
  units: Array<{ id: string; type: string; count: number }>;
}

export interface SimWorld {
  playerKingdomId: string;
  playerName: string;
  tickCount: number;
  provinces: SimProvince[];
  armies: SimArmy[];
  aiKingdoms: AiKingdomState[];
  relations: KingdomRelation[];
  wars: ActiveWar[];
  sieges: ActiveSiege[];
  chronicle: ChronicleEntry[];
  pendingEvents: PendingWorldEvent[];
  generals: WorldGeneral[];
  spyMissions: SpyMission[];
  goals: LongTermGoal[];
  playerSpies: number;
  /** Ressourcen des Spielers – werden bei Events mutiert */
  playerResources: {
    gold: number;
    food: number;
    wood: number;
    stone: number;
    iron: number;
    influence: number;
    fame: number;
  };
  playerDynasty: {
    characters: Array<{
      id: string;
      name: string;
      age: number;
      traits?: string[];
      isAlive: boolean;
      isRuler: boolean;
      isHeir: boolean;
      martial: number;
      diplomacy: number;
      stewardship: number;
      intrigue?: number;
      health?: number;
      experience?: number;
      prestige?: number;
      gender?: string;
    }>;
    ruler: { id: string; name: string; age: number; isAlive: boolean; isRuler: boolean; isHeir: boolean; martial: number; diplomacy: number; stewardship: number; intrigue?: number; health?: number; traits?: string[] } | null;
    heir: { id: string; name: string; age: number; isAlive: boolean; isRuler: boolean; isHeir: boolean; martial: number; diplomacy: number; stewardship: number; intrigue?: number; health?: number; traits?: string[] } | null;
  };
}

function troopCount(army: SimArmy): number {
  return army.units.reduce((s, u) => s + u.count, 0);
}

function uid(): string {
  return cryptoRandomId();
}

function makeCharacter(
  name: string,
  age: number,
  opts: { ruler?: boolean; heir?: boolean; traits?: string[] },
) {
  const traits = opts.traits ?? ['loyal'];
  return {
    id: uid(),
    name,
    age,
    gender: 'MALE',
    traits,
    martial: 6 + Math.floor(Math.random() * 6),
    diplomacy: 5 + Math.floor(Math.random() * 6),
    stewardship: 5 + Math.floor(Math.random() * 6),
    intrigue: 4 + Math.floor(Math.random() * 5),
    health: 80 + Math.floor(Math.random() * 20),
    experience: 0,
    prestige: 0,
    isAlive: true,
    isRuler: Boolean(opts.ruler),
    isHeir: Boolean(opts.heir),
  };
}

/** KI-Reiche in neutrale Provinzen setzen (bei Neustart oder Migration) */
export function spawnAiKingdoms(world: SimWorld): void {
  if (world.aiKingdoms.length > 0) return;

  const neutrals = world.provinces
    .filter((p) => !p.ownerId)
    .sort((a, b) => b.population - a.population);

  const templates = [...AI_KINGDOMS];
  const count = Math.min(4, neutrals.length);
  for (let i = 0; i < count; i++) {
    const capital = neutrals[i];
    if (!capital) break;
    const tpl = templates[i % templates.length];
    const personality = personalityFromTraits([...tpl.traits]);
    const ruler = makeCharacter(tpl.rulerName, 30 + Math.floor(Math.random() * 20), {
      ruler: true,
      traits: [...tpl.traits],
    });
    const heir = makeCharacter(`${tpl.rulerName.split(' ')[0]} II.`, 8 + Math.floor(Math.random() * 10), {
      heir: true,
      traits: ['ehrgeizig'],
    });
    const kid = uid();
    capital.ownerId = kid;
    capital.ownerName = tpl.name;
    capital.culture = tpl.culture;
    capital.religion = tpl.religion;
    capital.castle = { level: 1 };
    capital.village = { level: 1 };
    capital.city = { level: 0 };
    capital.defense = 20;

    // Nachbarprovinz oft mitnehmen
    const neighbor = world.provinces.find(
      (p) => !p.ownerId && capital.neighborSlugs.includes(p.slug),
    );
    if (neighbor && Math.random() < 0.7) {
      neighbor.ownerId = kid;
      neighbor.ownerName = tpl.name;
      neighbor.village = { level: 1 };
      neighbor.castle = { level: 1 };
      neighbor.defense = 15;
      world.armies.push({
        id: uid(),
        name: `Garnison ${neighbor.name}`,
        provinceId: neighbor.id,
        morale: 90,
        isGarrison: true,
        kingdomId: kid,
        units: [
          { id: uid(), type: 'MILITIA', count: 8 },
          { id: uid(), type: 'SPEARMAN', count: 4 },
        ],
      });
    }

    world.armies.push({
      id: uid(),
      name: `Garnison ${capital.name}`,
      provinceId: capital.id,
      morale: 95,
      isGarrison: true,
      kingdomId: kid,
      units: [
        { id: uid(), type: 'MILITIA', count: 10 },
        { id: uid(), type: 'SPEARMAN', count: 6 },
      ],
    });

    const general: WorldGeneral = {
      id: uid(),
      kingdomId: kid,
      name: `Marschall von ${capital.name}`,
      age: 40,
      martial: 8 + Math.floor(Math.random() * 5),
      personality: PERSONALITIES[personality].name,
      experience: 10,
      traits: ['tapfer'],
      alive: true,
      fame: 5,
    };
    world.generals.push(general);

    const ai: AiKingdomState = {
      id: kid,
      name: tpl.name,
      gold: 350 + Math.floor(Math.random() * 150),
      food: 250,
      wood: 150,
      stone: 120,
      iron: 60,
      influence: 15,
      fame: 5,
      personality,
      culture: tpl.culture,
      religion: tpl.religion,
      capitalProvinceId: capital.id,
      ruler,
      heir,
      characters: [ruler, heir],
      spies: 1,
      ageTick: 0,
    };
    world.aiKingdoms.push(ai);

    // Relation zum Spieler
    adjustOpinion(world.relations, world.playerKingdomId, kid, -5 + Math.floor(Math.random() * 20), 'Nachbarschaft');
    world.chronicle.push(
      makeChronicle(
        world.tickCount,
        'coronation',
        `${tpl.name} erhebt sich`,
        `${tpl.rulerName} herrscht in ${capital.name}. Persönlichkeit: ${PERSONALITIES[personality].name}.`,
      ),
    );
  }

  // Spieler-General + Ziele
  if (!world.generals.some((g) => g.kingdomId === world.playerKingdomId)) {
    world.generals.push({
      id: uid(),
      kingdomId: world.playerKingdomId,
      name: 'Erster Marschall',
      age: 35,
      martial: 9,
      personality: 'tapfer',
      experience: 5,
      traits: ['loyal', 'mutig'],
      alive: true,
      fame: 2,
    });
  }
  if (world.goals.length === 0) {
    world.goals = [
      { id: 'g1', title: 'Größte Hauptstadt', description: 'Baue die prächtigste Hauptstadt', progress: 0, target: 7, completed: false },
      { id: 'g2', title: 'Zehn Provinzen', description: 'Kontrolliere 10 Provinzen', progress: 1, target: 10, completed: false },
      { id: 'g3', title: 'Reichster Herrscher', description: 'Besitze 5000 Gold', progress: 0, target: 5000, completed: false },
      { id: 'g4', title: 'Dreißig Jahre Frieden', description: 'Halte 360 Ticks ohne Krieg', progress: 0, target: 360, completed: false },
    ];
  }
  if (world.playerSpies === undefined || world.playerSpies === 0) world.playerSpies = 1;
}

function provinceIdBySlug(world: SimWorld, slug: string): string | undefined {
  return world.provinces.find((p) => p.slug === slug)?.id;
}

function buildAiView(world: SimWorld, kingdom: AiKingdomState) {
  return {
    kingdom,
    provinces: world.provinces.map((p) => ({
      id: p.id,
      slug: p.slug,
      ownerId: p.ownerId,
      population: p.population,
      defense: p.defense,
      castleLevel: p.castle?.level ?? 0,
      villageLevel: p.village?.level ?? 0,
      cityLevel: p.city?.level ?? 0,
      neighborIds: p.neighborSlugs
        .map((s) => provinceIdBySlug(world, s))
        .filter(Boolean) as string[],
      prosperity: p.prosperity,
    })),
    armies: world.armies
      .filter((a) => {
        const owner = world.provinces.find((p) => p.id === a.provinceId)?.ownerId;
        return a.kingdomId === kingdom.id || owner === kingdom.id;
      })
      .map((a) => ({
        id: a.id,
        kingdomId: a.kingdomId ?? kingdom.id,
        provinceId: a.provinceId,
        troopCount: troopCount(a),
        isGarrison: a.isGarrison,
      })),
    relations: world.relations,
    wars: world.wars,
    otherKingdoms: [
      {
        id: world.playerKingdomId,
        name: world.playerName,
        religion: 'lichtglaube',
        provinceCount: world.provinces.filter((p) => p.ownerId === world.playerKingdomId).length,
      },
      ...world.aiKingdoms
        .filter((a) => a.id !== kingdom.id)
        .map((a) => ({
          id: a.id,
          name: a.name,
          religion: a.religion,
          provinceCount: world.provinces.filter((p) => p.ownerId === a.id).length,
        })),
    ],
    tick: world.tickCount,
  };
}

function transferProvince(_world: SimWorld, province: SimProvince, newOwnerId: string, newOwnerName: string) {
  province.ownerId = newOwnerId;
  province.ownerName = newOwnerName;
  if (!province.castle) province.castle = { level: 1 };
  if (!province.village) province.village = { level: 1 };
  if (!province.city) province.city = { level: 0 };
}

function applyAiEconomyTick(world: SimWorld, k: AiKingdomState) {
  const owned = world.provinces.filter((p) => p.ownerId === k.id);
  let gold = 8;
  let food = 10;
  for (const p of owned) {
    gold += Math.floor(p.population / 200) + Math.floor(p.prosperity / 20);
    food += Math.floor(p.population / 150);
    if (p.city?.level) gold += p.city.level * 3;
  }
  // Upkeep
  const troops = world.armies
    .filter((a) => a.kingdomId === k.id || owned.some((p) => p.id === a.provinceId && !a.kingdomId))
    .reduce((s, a) => s + troopCount(a), 0);
  gold -= Math.floor(troops * 0.4);
  food -= Math.floor(troops * 0.5);
  k.gold = Math.max(0, k.gold + gold);
  k.food = Math.max(0, k.food + food);
  k.wood += owned.length * 2;
  k.stone += owned.length;
  k.iron += Math.floor(owned.length / 2);
  k.influence += 1;
}

function executeAiAction(world: SimWorld, k: AiKingdomState, action: AiAction) {
  switch (action.type) {
    case 'recruit': {
      if (k.gold < action.costGold || k.food < action.costFood) return;
      k.gold -= action.costGold;
      k.food -= action.costFood;
      let army = world.armies.find(
        (a) => a.provinceId === action.provinceId && a.isGarrison && (a.kingdomId === k.id || !a.kingdomId),
      );
      if (!army) {
        army = {
          id: uid(),
          name: `Garnison`,
          provinceId: action.provinceId,
          morale: 90,
          isGarrison: true,
          kingdomId: k.id,
          units: [],
        };
        world.armies.push(army);
      }
      army.kingdomId = k.id;
      const existing = army.units.find((u) => u.type === action.unitType);
      if (existing) existing.count += action.count;
      else army.units.push({ id: uid(), type: action.unitType, count: action.count });
      break;
    }
    case 'build_castle': {
      const p = world.provinces.find((x) => x.id === action.provinceId);
      if (!p || k.gold < action.costGold || k.stone < action.costStone) return;
      k.gold -= action.costGold;
      k.stone -= action.costStone;
      if (!p.castle) p.castle = { level: 1 };
      else p.castle.level = Math.min(5, p.castle.level + 1);
      p.defense += 8;
      world.chronicle.push(
        makeChronicle(world.tickCount, 'city', `Burgbau in ${p.name}`, `${k.name} stärkt die Festung ${p.name}.`),
      );
      break;
    }
    case 'upgrade_village': {
      const p = world.provinces.find((x) => x.id === action.provinceId);
      if (!p || !p.village || k.gold < action.costGold) return;
      k.gold -= action.costGold;
      p.village.level = Math.min(5, p.village.level + 1);
      p.population += 150;
      p.prosperity += 3;
      break;
    }
    case 'found_city': {
      const p = world.provinces.find((x) => x.id === action.provinceId);
      if (!p || k.gold < 150) return;
      k.gold -= 150;
      p.city = { level: 1 };
      world.chronicle.push(
        makeChronicle(world.tickCount, 'city', `Stadtgründung`, `${k.name} erhebt ${p.name} zur Stadt.`),
      );
      break;
    }
    case 'place_market': {
      const p = world.provinces.find((x) => x.id === action.provinceId);
      if (!p || k.gold < 50) return;
      k.gold -= 50;
      p.buildings.push({ id: uid(), type: BuildingType.MARKET, level: 1 });
      p.prosperity += 4;
      k.gold += 15;
      break;
    }
    case 'expand_neutral': {
      const target = world.provinces.find((x) => x.id === action.targetProvinceId);
      if (!target || target.ownerId) return;
      // Braucht Truppen
      let army = world.armies.find(
        (a) => a.kingdomId === k.id && !a.isGarrison && troopCount(a) >= 8,
      );
      if (!army) {
        const g = world.armies.find(
          (a) => a.provinceId === action.fromProvinceId && troopCount(a) >= 12,
        );
        if (!g) return;
        // Feldarmee abspalten
        army = {
          id: uid(),
          name: `Heer von ${k.name}`,
          provinceId: action.fromProvinceId,
          morale: 85,
          isGarrison: false,
          kingdomId: k.id,
          units: [
            { id: uid(), type: 'SPEARMAN', count: 6 },
            { id: uid(), type: 'MILITIA', count: 4 },
          ],
        };
        // Truppen von Garnison abziehen
        for (const u of g.units) {
          const take = Math.min(u.count, 3);
          u.count -= take;
        }
        g.units = g.units.filter((u) => u.count > 0);
        world.armies.push(army);
      }
      transferProvince(world, target, k.id, k.name);
      army.provinceId = target.id;
      world.armies.push({
        id: uid(),
        name: `Garnison ${target.name}`,
        provinceId: target.id,
        morale: 80,
        isGarrison: true,
        kingdomId: k.id,
        units: [{ id: uid(), type: 'MILITIA', count: 5 }],
      });
      k.fame += 3;
      world.chronicle.push(
        makeChronicle(
          world.tickCount,
          'battle',
          `${target.name} fällt an ${k.name}`,
          `${k.name} nimmt die herrenlose Provinz ${target.name} ein.`,
        ),
      );
      break;
    }
    case 'declare_war': {
      if (areAtWar(world.wars, k.id, action.targetId)) return;
      if (k.influence < 8) return;
      k.influence -= 8;
      const targetName =
        action.targetId === world.playerKingdomId
          ? world.playerName
          : world.aiKingdoms.find((a) => a.id === action.targetId)?.name ?? 'Unbekannt';
      const text = warReasonText(action.reasonId, k.name, targetName);
      world.wars.push({
        id: uid(),
        attackerId: k.id,
        defenderId: action.targetId,
        reasonId: action.reasonId,
        reasonText: text,
        startedTick: world.tickCount,
        startedAt: Date.now(),
      });
      const rel = ensureRelation(world.relations, k.id, action.targetId);
      rel.status = 'AT_WAR';
      rel.opinion = Math.min(rel.opinion, -40);
      rel.lastReason = text;
      world.chronicle.push(makeChronicle(world.tickCount, 'war', 'Krieg!', text));
      break;
    }
    case 'offer_trade': {
      const rel = ensureRelation(world.relations, k.id, action.targetId);
      if (rel.status === 'AT_WAR') return;
      rel.status = 'TRADE_PACT';
      adjustOpinion(world.relations, k.id, action.targetId, 8, 'Handelsvertrag');
      k.gold += 10;
      break;
    }
    case 'offer_alliance': {
      const rel = ensureRelation(world.relations, k.id, action.targetId);
      if (rel.status === 'AT_WAR' || rel.opinion < 10) return;
      // Spieler-Allianz nur als Angebot notieren – Auto-Accept bei hoher Opinion
      if (action.targetId === world.playerKingdomId && rel.opinion < 35) {
        adjustOpinion(world.relations, k.id, action.targetId, 5, 'Bündnisangebot');
        return;
      }
      rel.status = 'ALLIED';
      adjustOpinion(world.relations, k.id, action.targetId, 15, 'Bündnis');
      world.chronicle.push(
        makeChronicle(
          world.tickCount,
          'alliance',
          'Bündnis',
          `${k.name} schließt ein Bündnis.`,
        ),
      );
      break;
    }
    case 'start_siege': {
      const target = world.provinces.find((x) => x.id === action.targetProvinceId);
      const army = world.armies.find((a) => a.id === action.armyId);
      if (!target?.ownerId || !army) return;
      if (world.sieges.some((s) => s.provinceId === target.id)) return;
      army.provinceId = target.id; // belagernd vor Ort
      const siege = createSiege({
        id: uid(),
        provinceId: target.id,
        attackerKingdomId: k.id,
        defenderKingdomId: target.ownerId,
        armyId: army.id,
        castleLevel: target.castle?.level ?? 1,
        tick: world.tickCount,
      });
      world.sieges.push(siege);
      world.chronicle.push(
        makeChronicle(
          world.tickCount,
          'siege',
          `Belagerung von ${target.name}`,
          `${k.name} beginnt die Belagerung von ${target.name}.`,
        ),
      );
      break;
    }
    case 'attack_field': {
      const target = world.provinces.find((x) => x.id === action.targetProvinceId);
      const army = world.armies.find((a) => a.id === action.armyId);
      if (!target?.ownerId || !army) return;
      resolveAiAttack(world, k, army, target);
      break;
    }
    default:
      break;
  }
}

function resolveAiAttack(world: SimWorld, k: AiKingdomState, army: SimArmy, target: SimProvince) {
  const defenders = world.armies.filter((a) => a.provinceId === target.id && a.id !== army.id);
  const defUnits =
    defenders.length > 0
      ? defenders.flatMap((d) => d.units.map((u) => ({ type: u.type as UnitType, count: u.count })))
      : [{ type: UnitType.MILITIA, count: 5 }];

  const result = resolveBattle({
    attackerUnits: army.units.map((u) => ({ type: u.type as UnitType, count: u.count })),
    defenderUnits: defUnits,
    terrain: (target.terrain as Terrain) ?? Terrain.PLAINS,
    castleLevel: target.castle?.level ?? 0,
    attackerCommanderMartial: k.ruler.martial,
    defenderCommanderMartial: 6,
    attackerMorale: army.morale,
    defenderMorale: 70,
  });

  // Attacker casualties
  for (const c of result.attackerCasualties) {
    const u = army.units.find((x) => x.type === c.type);
    if (u) u.count = Math.max(0, u.count - c.count);
  }
  army.units = army.units.filter((u) => u.count > 0);

  // Defender casualties
  for (const d of defenders) {
    for (const c of result.defenderCasualties) {
      const u = d.units.find((x) => x.type === c.type);
      if (u) u.count = Math.max(0, u.count - Math.ceil(c.count / Math.max(1, defenders.length)));
    }
    d.units = d.units.filter((u) => u.count > 0);
  }
  world.armies = world.armies.filter((a) => !a.isGarrison || troopCount(a) > 0 || a.provinceId !== target.id);
  world.armies = world.armies.filter((a) => troopCount(a) > 0 || a.isGarrison);

  if (result.attackerWon) {
    const oldOwner = target.ownerId;
    transferProvince(world, target, k.id, k.name);
    army.provinceId = target.id;
    k.fame += 5;
    if (oldOwner) {
      adjustOpinion(world.relations, oldOwner, k.id, -20, 'defeat');
    }
    world.chronicle.push(
      makeChronicle(
        world.tickCount,
        'battle',
        `Schlacht um ${target.name}`,
        `${k.name} siegt und nimmt ${target.name} ein.`,
      ),
    );
  } else {
    adjustOpinion(world.relations, k.id, target.ownerId!, -5, 'defeat');
    world.chronicle.push(
      makeChronicle(
        world.tickCount,
        'battle',
        `Abwehr bei ${target.name}`,
        `${k.name} scheitert vor ${target.name}.`,
      ),
    );
  }
}

function processSieges(world: SimWorld) {
  const remaining: ActiveSiege[] = [];
  for (let siege of world.sieges) {
    const province = world.provinces.find((p) => p.id === siege.provinceId);
    const army = world.armies.find((a) => a.id === siege.armyId);
    if (!province || !army || troopCount(army) < 3) {
      world.chronicle.push(
        makeChronicle(world.tickCount, 'siege', 'Belagerung abgebrochen', `Die Belagerung von ${province?.name ?? '?'} endet.`),
      );
      continue;
    }
    const defPower = world.armies
      .filter((a) => a.provinceId === siege.provinceId && a.id !== army.id)
      .reduce((s, a) => s + troopCount(a), 5);
    siege = tickSiege(siege, troopCount(army), defPower);
    const outcome = evaluateSiege(siege);

    if (outcome === 'surrender' || outcome === 'storm_ready') {
      // Einnahme
      const attacker =
        world.aiKingdoms.find((a) => a.id === siege.attackerKingdomId) ??
        (siege.attackerKingdomId === world.playerKingdomId
          ? { id: world.playerKingdomId, name: world.playerName }
          : null);
      if (attacker) {
        transferProvince(world, province, attacker.id, attacker.name);
        army.provinceId = province.id;
        world.chronicle.push(
          makeChronicle(
            world.tickCount,
            'siege',
            `${province.name} gefallen`,
            outcome === 'surrender'
              ? `Die Besatzung von ${province.name} kapituliert vor Hunger.`
              : `Nach langer Belagerung fällt ${province.name}.`,
          ),
        );
        // Verteidiger-Armeen entfernen
        world.armies = world.armies.filter(
          (a) => !(a.provinceId === province.id && a.id !== army.id && a.isGarrison),
        );
      }
      continue;
    }
    remaining.push(siege);
  }
  world.sieges = remaining;
}

function ageDynasties(world: SimWorld) {
  // Alle 10 Ticks +1 Jahr
  if (world.tickCount % 10 !== 0) return;

  const ageChar = (c: { age: number; isAlive: boolean; isRuler: boolean; name: string; id: string }) => {
    if (!c.isAlive) return;
    c.age += 1;
  };

  for (const c of world.playerDynasty.characters) ageChar(c);
  if (world.playerDynasty.ruler) ageChar(world.playerDynasty.ruler);
  if (world.playerDynasty.heir) ageChar(world.playerDynasty.heir);

  // Tod & Thronfolge Spieler
  const ruler = world.playerDynasty.ruler;
  if (ruler && ruler.isAlive && shouldRulerDieFromAge(ruler.age)) {
    ruler.isAlive = false;
    const heir = world.playerDynasty.heir;
    if (heir && heir.isAlive) {
      heir.isRuler = true;
      heir.isHeir = false;
      world.playerDynasty.ruler = { ...heir, isRuler: true, isHeir: false };
      // Neuer Erbe
      const child = makeCharacter(`${heir.name.split(' ')[0]}s Kind`, 5, { heir: true, traits: ['loyal'] });
      world.playerDynasty.characters.push(child);
      world.playerDynasty.heir = child;
      world.playerDynasty.characters = world.playerDynasty.characters.map((c) =>
        c.id === heir.id ? { ...c, isRuler: true, isHeir: false } : c.id === ruler.id ? { ...c, isAlive: false } : c,
      );
      world.chronicle.push(
        makeChronicle(
          world.tickCount,
          'succession',
          'Thronfolge',
          `${ruler.name} starb im Alter von ${ruler.age}. ${heir.name} besteigt den Thron.`,
        ),
      );
    }
  }

  for (const k of world.aiKingdoms) {
    k.ageTick += 1;
    k.ruler.age += 1;
    if (k.heir) k.heir.age += 1;
    for (const c of k.characters) {
      if (c.isAlive) c.age += 1;
    }
    if (shouldRulerDieFromAge(k.ruler.age)) {
      k.ruler.isAlive = false;
      if (k.heir && k.heir.isAlive) {
        const old = k.ruler.name;
        k.heir.isRuler = true;
        k.heir.isHeir = false;
        k.ruler = { ...k.heir, isRuler: true, isHeir: false };
        k.heir = makeCharacter(`Erbe von ${k.name}`, 6, { heir: true });
        k.characters.push(k.heir);
        world.chronicle.push(
          makeChronicle(world.tickCount, 'death', `Tod in ${k.name}`, `${old} starb. ${k.ruler.name} folgt nach.`),
        );
      }
    }
  }

  // Generäle altern
  for (const g of world.generals) {
    if (g.alive) g.age += 1;
    if (g.age > 75 && Math.random() < 0.15) {
      g.alive = false;
      world.chronicle.push(
        makeChronicle(world.tickCount, 'death', `Tod eines Generals`, `${g.name} stirbt im Alter von ${g.age}.`),
      );
    }
  }
}

function updateGoals(world: SimWorld) {
  const owned = world.provinces.filter((p) => p.ownerId === world.playerKingdomId).length;
  const atWar = world.wars.some(
    (w) => w.attackerId === world.playerKingdomId || w.defenderId === world.playerKingdomId,
  );
  for (const g of world.goals) {
    if (g.completed) continue;
    if (g.id === 'g2') g.progress = owned;
    if (g.id === 'g3') g.progress = world.playerResources.gold;
    if (g.id === 'g4') {
      if (!atWar) g.progress += 1;
      else g.progress = 0;
    }
    if (g.progress >= g.target) {
      g.completed = true;
      world.chronicle.push(
        makeChronicle(world.tickCount, 'event', `Ziel erreicht: ${g.title}`, g.description),
      );
      world.playerResources.fame += 10;
    }
  }
}

function driftRelations(world: SimWorld) {
  for (const r of world.relations) {
    if (r.status === 'AT_WAR') {
      r.opinion = Math.max(-100, r.opinion - 1);
      continue;
    }
    if (r.status === 'ALLIED') r.opinion = Math.min(100, r.opinion + 1);
    if (r.status === 'TRADE_PACT') {
      r.opinion = Math.min(100, r.opinion + 0.5);
      // Handelsgold
      if (r.aId === world.playerKingdomId || r.bId === world.playerKingdomId) {
        world.playerResources.gold += 2;
      }
    }
  }
}

/** Ein voller Welt-Tick (nach Spieler-Wirtschaft) */
export function simulateWorldTick(world: SimWorld): { successionMsg?: string; warAlert?: string } {
  spawnAiKingdoms(world);
  world.tickCount += 1;
  let successionMsg: string | undefined;
  let warAlert: string | undefined;

  // KI Wirtschaft + Aktionen
  for (const k of world.aiKingdoms) {
    applyAiEconomyTick(world, k);
    const view = buildAiView(world, k);
    const action = decideAiAction(view);
    const warsBefore = world.wars.length;
    executeAiAction(world, k, action);
    if (world.wars.length > warsBefore) {
      const w = world.wars[world.wars.length - 1];
      if (w.defenderId === world.playerKingdomId || w.attackerId === world.playerKingdomId) {
        warAlert = w.reasonText;
      }
    }
  }

  processSieges(world);
  driftRelations(world);
  ageDynasties(world);

  // Ereignis für Spieler (max 1 pending)
  if (world.pendingEvents.length === 0) {
    const ownedIds = world.provinces
      .filter((p) => p.ownerId === world.playerKingdomId)
      .map((p) => p.id);
    const ev = rollWorldEvent(ownedIds, world.tickCount);
    if (ev) world.pendingEvents.push(ev);
  }

  updateGoals(world);

  // Chronik begrenzen (Performance)
  if (world.chronicle.length > 200) {
    world.chronicle = world.chronicle.slice(-200);
  }

  // Succession message
  const last = world.chronicle[world.chronicle.length - 1];
  if (last?.category === 'succession' && last.tick === world.tickCount) {
    successionMsg = last.text;
  }

  return { successionMsg, warAlert };
}

export function defaultWorldExtras() {
  return {
    aiKingdoms: [] as AiKingdomState[],
    relations: [] as KingdomRelation[],
    wars: [] as ActiveWar[],
    sieges: [] as ActiveSiege[],
    chronicle: [] as ChronicleEntry[],
    pendingEvents: [] as PendingWorldEvent[],
    generals: [] as WorldGeneral[],
    spyMissions: [] as SpyMission[],
    goals: [] as LongTermGoal[],
    playerSpies: 1,
    tickCount: 0,
  };
}
