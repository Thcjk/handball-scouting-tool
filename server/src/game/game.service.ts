import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  resolveBattle,
  UNIT_DEFINITIONS,
  BUILDING_DEFINITIONS,
  canAfford,
  subtractResources,
  Terrain,
  UnitType as SharedUnitType,
  BuildingType as SharedBuildingType,
  CITY_FOUND_COST,
  CITY_FOUND_REQUIREMENTS,
  CITY_UPGRADE_COST_PER_LEVEL,
  MAX_CITY_LEVEL,
  getCityBuildingMinLevel,
} from '@kronenchronik/shared';
import {
  BuildDto,
  RecruitDto,
  CreateArmyDto,
  AttackDto,
  UpgradeCastleDto,
  FoundCityDto,
  UpgradeCityDto,
} from './dto/game.dto';
import { UnitType } from '@prisma/client';
import { DynastyService } from '../dynasty/dynasty.service';
import { DiplomacyService } from '../diplomacy/diplomacy.service';
import { GameGateway } from './game.gateway';

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private dynastyService: DynastyService,
    @Inject(forwardRef(() => DiplomacyService))
    private diplomacyService: DiplomacyService,
    private gameGateway: GameGateway,
  ) {}

  async getGameState(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() },
    });

    const kingdom = await this.getKingdomByUser(userId);
    const provinces = await this.prisma.province.findMany({
      include: {
        kingdom: { select: { id: true, name: true } },
        castle: true,
        village: true,
        city: true,
        buildings: true,
        armies: { include: { units: true, kingdom: { select: { id: true, name: true } } } },
        neighbors: { include: { neighbor: { select: { id: true, slug: true, name: true } } } },
      },
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });

    const armies = await this.prisma.army.findMany({
      where: { kingdomId: kingdom.id },
      include: { units: true, province: { select: { id: true, name: true } } },
    });

    const battles = await this.prisma.battle.findMany({
      where: { OR: [{ attackerId: kingdom.id }, { defenderId: kingdom.id }] },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        province: { select: { name: true } },
        attacker: { select: { name: true } },
        defender: { select: { name: true } },
      },
    });

    const dynasty = await this.dynastyService.getDynastyInfo(kingdom.id);

    return {
      kingdom: {
        id: kingdom.id,
        name: kingdom.name,
        resources: {
          gold: kingdom.gold,
          food: kingdom.food,
          wood: kingdom.wood,
          stone: kingdom.stone,
          iron: kingdom.iron,
          influence: kingdom.influence,
          fame: kingdom.fame,
        },
      },
      dynasty,
      provinces: provinces.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        x: p.x,
        y: p.y,
        terrain: p.terrain,
        population: p.population,
        prosperity: p.prosperity,
        defense: p.defense,
        ownerId: p.kingdomId,
        ownerName: p.kingdom?.name ?? null,
        isOwned: p.kingdomId === kingdom.id,
        castle: p.castle,
        village: p.village,
        city: p.city,
        buildings: p.buildings,
        armies: p.armies,
        neighbors: p.neighbors.map((n) => n.neighbor),
      })),
      armies,
      recentBattles: battles,
    };
  }

  async buildBuilding(userId: string, dto: BuildDto) {
    const kingdom = await this.getKingdomByUser(userId);
    const province = await this.assertProvinceOwnership(kingdom.id, dto.provinceId);

    const buildingDef = BUILDING_DEFINITIONS[dto.buildingType as SharedBuildingType];
    if (!buildingDef) throw new BadRequestException('Unbekannter Gebäudetyp');

    const minCityLevel = getCityBuildingMinLevel(buildingDef.category);
    if (minCityLevel > 0 && (province.city?.level ?? 0) < minCityLevel) {
      throw new BadRequestException('Stadt muss zuerst gegründet werden für dieses Gebäude');
    }

    const existing = await this.prisma.building.findUnique({
      where: { provinceId_type: { provinceId: dto.provinceId, type: dto.buildingType } },
    });

    const nextLevel = existing ? existing.level + 1 : 1;
    if (nextLevel > buildingDef.maxLevel) {
      throw new BadRequestException('Maximales Gebäudelevel erreicht');
    }

    const cost = {
      gold: buildingDef.costPerLevel.gold * nextLevel,
      food: buildingDef.costPerLevel.food * nextLevel,
      wood: buildingDef.costPerLevel.wood * nextLevel,
      stone: buildingDef.costPerLevel.stone * nextLevel,
      iron: buildingDef.costPerLevel.iron * nextLevel,
    };

    const resources = this.kingdomResources(kingdom);
    if (!canAfford(resources, cost)) {
      throw new BadRequestException('Nicht genügend Ressourcen');
    }

    const updated = subtractResources(resources, cost);

    await this.prisma.$transaction([
      this.prisma.kingdom.update({
        where: { id: kingdom.id },
        data: {
          gold: updated.gold,
          food: updated.food,
          wood: updated.wood,
          stone: updated.stone,
          iron: updated.iron,
        },
      }),
      existing
        ? this.prisma.building.update({
            where: { id: existing.id },
            data: { level: nextLevel },
          })
        : this.prisma.building.create({
            data: { provinceId: dto.provinceId, type: dto.buildingType, level: 1 },
          }),
    ]);

    if (buildingDef.effects.defense) {
      await this.prisma.province.update({
        where: { id: province.id },
        data: { defense: { increment: buildingDef.effects.defense } },
      });
    }

    return this.emitState(userId);
  }

  async foundCity(userId: string, dto: FoundCityDto) {
    const kingdom = await this.getKingdomByUser(userId);
    const province = await this.assertProvinceOwnership(kingdom.id, dto.provinceId);

    if (!province.village || province.village.level < CITY_FOUND_REQUIREMENTS.minVillageLevel) {
      throw new BadRequestException(
        `Dorf muss mindestens Stufe ${CITY_FOUND_REQUIREMENTS.minVillageLevel} sein`,
      );
    }
    if (province.population < CITY_FOUND_REQUIREMENTS.minPopulation) {
      throw new BadRequestException(
        `Mindestens ${CITY_FOUND_REQUIREMENTS.minPopulation} Bevölkerung erforderlich`,
      );
    }
    if (province.prosperity < CITY_FOUND_REQUIREMENTS.minProsperity) {
      throw new BadRequestException(
        `Mindestens ${CITY_FOUND_REQUIREMENTS.minProsperity} Wohlstand erforderlich`,
      );
    }
    if (province.city && province.city.level > 0) {
      throw new BadRequestException('Stadt bereits gegründet');
    }

    const resources = this.kingdomResources(kingdom);
    if (!canAfford(resources, CITY_FOUND_COST)) {
      throw new BadRequestException('Nicht genügend Ressourcen');
    }

    const updated = subtractResources(resources, CITY_FOUND_COST);

    await this.prisma.$transaction([
      this.prisma.kingdom.update({
        where: { id: kingdom.id },
        data: {
          gold: updated.gold,
          food: updated.food,
          wood: updated.wood,
          stone: updated.stone,
          iron: updated.iron,
          fame: { increment: 5 },
        },
      }),
      this.prisma.city.update({
        where: { id: province.city!.id },
        data: { level: 1 },
      }),
      this.prisma.province.update({
        where: { id: province.id },
        data: { prosperity: { increment: 15 }, population: { increment: 500 } },
      }),
    ]);

    return this.emitState(userId);
  }

  async upgradeCity(userId: string, dto: UpgradeCityDto) {
    const kingdom = await this.getKingdomByUser(userId);
    const province = await this.assertProvinceOwnership(kingdom.id, dto.provinceId);

    if (!province.city || province.city.level === 0) {
      throw new BadRequestException('Keine Stadt in dieser Provinz');
    }

    const nextLevel = province.city.level + 1;
    if (nextLevel > MAX_CITY_LEVEL) {
      throw new BadRequestException('Maximale Stadtstufe erreicht');
    }

    const cost = {
      gold: CITY_UPGRADE_COST_PER_LEVEL.gold * nextLevel,
      food: CITY_UPGRADE_COST_PER_LEVEL.food * nextLevel,
      wood: CITY_UPGRADE_COST_PER_LEVEL.wood * nextLevel,
      stone: CITY_UPGRADE_COST_PER_LEVEL.stone * nextLevel,
      iron: CITY_UPGRADE_COST_PER_LEVEL.iron * nextLevel,
    };

    const resources = this.kingdomResources(kingdom);
    if (!canAfford(resources, cost)) {
      throw new BadRequestException('Nicht genügend Ressourcen');
    }

    const updated = subtractResources(resources, cost);

    await this.prisma.$transaction([
      this.prisma.kingdom.update({
        where: { id: kingdom.id },
        data: {
          gold: updated.gold,
          food: updated.food,
          wood: updated.wood,
          stone: updated.stone,
          iron: updated.iron,
        },
      }),
      this.prisma.city.update({
        where: { id: province.city.id },
        data: { level: nextLevel },
      }),
      this.prisma.province.update({
        where: { id: province.id },
        data: { prosperity: { increment: 10 } },
      }),
    ]);

    return this.emitState(userId);
  }

  async recruitUnits(userId: string, dto: RecruitDto) {
    const kingdom = await this.getKingdomByUser(userId);
    await this.assertProvinceOwnership(kingdom.id, dto.provinceId);

    const unitDef = UNIT_DEFINITIONS[dto.unitType as SharedUnitType];
    const cost = {
      gold: unitDef.gold * dto.count,
      food: unitDef.food * dto.count,
      wood: unitDef.wood * dto.count,
      stone: unitDef.stone * dto.count,
      iron: unitDef.iron * dto.count,
    };

    const resources = this.kingdomResources(kingdom);
    if (!canAfford(resources, cost)) {
      throw new BadRequestException('Nicht genügend Ressourcen');
    }

    const updated = subtractResources(resources, cost);

    let garrison = await this.prisma.army.findFirst({
      where: { kingdomId: kingdom.id, provinceId: dto.provinceId, isGarrison: true },
      include: { units: true },
    });

    if (!garrison) {
      garrison = await this.prisma.army.create({
        data: {
          name: 'Garnison',
          kingdomId: kingdom.id,
          provinceId: dto.provinceId,
          isGarrison: true,
        },
        include: { units: true },
      });
    }

    const existingUnit = garrison.units.find((u) => u.type === dto.unitType);

    await this.prisma.$transaction([
      this.prisma.kingdom.update({
        where: { id: kingdom.id },
        data: {
          gold: updated.gold,
          food: updated.food,
          wood: updated.wood,
          stone: updated.stone,
          iron: updated.iron,
        },
      }),
      existingUnit
        ? this.prisma.unit.update({
            where: { id: existingUnit.id },
            data: { count: existingUnit.count + dto.count },
          })
        : this.prisma.unit.create({
            data: { armyId: garrison.id, type: dto.unitType, count: dto.count },
          }),
    ]);

    return this.emitState(userId);
  }

  async createArmy(userId: string, dto: CreateArmyDto) {
    const kingdom = await this.getKingdomByUser(userId);
    await this.assertProvinceOwnership(kingdom.id, dto.provinceId);

    const garrison = await this.prisma.army.findFirst({
      where: { kingdomId: kingdom.id, provinceId: dto.provinceId, isGarrison: true },
      include: { units: true },
    });

    if (!garrison || garrison.units.length === 0) {
      throw new BadRequestException('Keine Truppen in der Garnison verfügbar');
    }

    await this.prisma.army.create({
      data: {
        name: dto.name,
        kingdomId: kingdom.id,
        provinceId: dto.provinceId,
        isGarrison: false,
        units: {
          create: garrison.units.map((u) => ({
            type: u.type,
            count: Math.floor(u.count / 2) || 1,
          })),
        },
      },
    });

    for (const unit of garrison.units) {
      const transfer = Math.floor(unit.count / 2) || (unit.count > 0 ? 1 : 0);
      await this.prisma.unit.update({
        where: { id: unit.id },
        data: { count: Math.max(0, unit.count - transfer) },
      });
    }

    const state = await this.emitState(userId);
    return { gameState: state };
  }

  async upgradeCastle(userId: string, dto: UpgradeCastleDto) {
    const kingdom = await this.getKingdomByUser(userId);
    const province = await this.assertProvinceOwnership(kingdom.id, dto.provinceId);

    if (!province.castle) throw new BadRequestException('Keine Burg in dieser Provinz');

    const nextLevel = province.castle.level + 1;
    if (nextLevel > 5) throw new BadRequestException('Maximale Burgstufe erreicht');

    const cost = {
      gold: 100 * nextLevel,
      food: 0,
      wood: 50 * nextLevel,
      stone: 80 * nextLevel,
      iron: 20 * nextLevel,
    };

    const resources = this.kingdomResources(kingdom);
    if (!canAfford(resources, cost)) {
      throw new BadRequestException('Nicht genügend Ressourcen');
    }

    const updated = subtractResources(resources, cost);

    await this.prisma.$transaction([
      this.prisma.kingdom.update({
        where: { id: kingdom.id },
        data: {
          gold: updated.gold,
          food: updated.food,
          wood: updated.wood,
          stone: updated.stone,
          iron: updated.iron,
        },
      }),
      this.prisma.castle.update({
        where: { id: province.castle.id },
        data: { level: nextLevel },
      }),
      this.prisma.province.update({
        where: { id: province.id },
        data: { defense: { increment: 10 } },
      }),
    ]);

    return this.emitState(userId);
  }

  async attackProvince(userId: string, dto: AttackDto) {
    const kingdom = await this.getKingdomByUser(userId);

    const army = await this.prisma.army.findUnique({
      where: { id: dto.armyId },
      include: { units: true, province: true },
    });

    if (!army || army.kingdomId !== kingdom.id) {
      throw new NotFoundException('Armee nicht gefunden');
    }

    if (army.isGarrison) {
      throw new BadRequestException('Garnisonen können nicht angreifen. Erstelle eine Armee.');
    }

    const target = await this.prisma.province.findUnique({
      where: { id: dto.targetProvinceId },
      include: {
        kingdom: true,
        castle: true,
        village: true,
        city: true,
        armies: { include: { units: true } },
        neighbors: { include: { neighbor: true } },
      },
    });

    if (!target) throw new NotFoundException('Zielprovinz nicht gefunden');

    const sourceNeighbors = await this.prisma.provinceNeighbor.findMany({
      where: { provinceId: army.provinceId },
    });
    const isNeighbor = sourceNeighbors.some((n) => n.neighborId === target.id);
    if (!isNeighbor) {
      throw new BadRequestException('Ziel muss an die Ausgangsprovinz angrenzen');
    }

    if (target.kingdomId === kingdom.id) {
      throw new BadRequestException('Eigene Provinzen können nicht angegriffen werden');
    }

    const warCheck = await this.diplomacyService.canAttack(kingdom.id, target.kingdomId);
    if (!warCheck.allowed) {
      throw new ForbiddenException(warCheck.reason);
    }

    const ruler = await this.prisma.character.findFirst({
      where: { kingdomId: kingdom.id, isRuler: true, isAlive: true },
    });

    const defenderRuler = target.kingdomId
      ? await this.prisma.character.findFirst({
          where: { kingdomId: target.kingdomId, isRuler: true, isAlive: true },
        })
      : null;

    const defenderUnits = target.armies.flatMap((a) =>
      a.units.map((u) => ({ type: u.type as SharedUnitType, count: u.count })),
    );

    if (defenderUnits.length === 0 && !target.kingdomId) {
      defenderUnits.push({ type: 'MILITIA' as SharedUnitType, count: 5 });
    }

    const battleResult = resolveBattle({
      attackerUnits: army.units.map((u) => ({
        type: u.type as SharedUnitType,
        count: u.count,
      })),
      defenderUnits,
      terrain: target.terrain as Terrain,
      attackerMorale: army.morale,
      defenderMorale: 80,
      castleLevel: target.castle?.level ?? 0,
      attackerCommanderMartial: ruler?.martial ?? 5,
      defenderCommanderMartial: defenderRuler?.martial ?? 5,
    });

    await this.applyBattleCasualties(army.id, army.units, battleResult.attackerCasualties);

    for (const defArmy of target.armies) {
      await this.applyBattleCasualties(defArmy.id, defArmy.units, battleResult.defenderCasualties);
    }

    let successionResult = null;
    if (ruler && !battleResult.attackerWon) {
      successionResult = await this.dynastyService.checkBattleDeath(kingdom.id, ruler.id);
    }
    if (defenderRuler && battleResult.attackerWon && target.kingdomId) {
      await this.dynastyService.checkBattleDeath(target.kingdomId, defenderRuler.id);
    }

    if (battleResult.attackerWon) {
      await this.prisma.province.update({
        where: { id: target.id },
        data: { kingdomId: kingdom.id },
      });

      await this.prisma.army.update({
        where: { id: army.id },
        data: { provinceId: target.id },
      });

      await this.prisma.kingdom.update({
        where: { id: kingdom.id },
        data: { fame: { increment: target.kingdomId ? 10 : 5 } },
      });

      if (!target.castle) {
        await this.prisma.castle.create({ data: { provinceId: target.id, level: 1 } });
      }
      if (!target.village) {
        await this.prisma.village.create({ data: { provinceId: target.id, level: 1 } });
      }
      if (!target.city) {
        await this.prisma.city.create({ data: { provinceId: target.id, level: 0 } });
      }
    }

    const battle = await this.prisma.battle.create({
      data: {
        attackerId: kingdom.id,
        defenderId: target.kingdomId,
        provinceId: target.id,
        attackerWon: battleResult.attackerWon,
        report: battleResult as object,
      },
    });

    const gameState = await this.emitState(userId);
    this.gameGateway.emitToUser(userId, 'battleResult', {
      battle,
      result: battleResult,
      successionResult,
    });

    return { battle, result: battleResult, successionResult, gameState };
  }

  private async emitState(userId: string) {
    const state = await this.getGameState(userId);
    this.gameGateway.emitGameStateUpdate(userId, state);
    return state;
  }

  private async applyBattleCasualties(
    armyId: string,
    currentUnits: Array<{ id: string; type: UnitType; count: number }>,
    casualties: Array<{ type: SharedUnitType; count: number }>,
  ) {
    for (const unit of currentUnits) {
      const casualty = casualties.find((c) => c.type === unit.type);
      const lost = casualty?.count ?? 0;
      const remaining = Math.max(0, unit.count - lost);
      if (remaining === 0) {
        await this.prisma.unit.delete({ where: { id: unit.id } });
      } else {
        await this.prisma.unit.update({
          where: { id: unit.id },
          data: { count: remaining },
        });
      }
    }

    const remainingUnits = await this.prisma.unit.count({ where: { armyId } });
    if (remainingUnits === 0) {
      await this.prisma.army.delete({ where: { id: armyId } });
    }
  }

  private async getKingdomByUser(userId: string) {
    const kingdom = await this.prisma.kingdom.findUnique({
      where: { userId },
      include: {
        provinces: { include: { castle: true, village: true, city: true } },
      },
    });
    if (!kingdom) throw new NotFoundException('Kein Königreich gefunden');
    return kingdom;
  }

  private async assertProvinceOwnership(kingdomId: string, provinceId: string) {
    const province = await this.prisma.province.findUnique({
      where: { id: provinceId },
      include: { castle: true, village: true, city: true },
    });
    if (!province) throw new NotFoundException('Provinz nicht gefunden');
    if (province.kingdomId !== kingdomId) {
      throw new ForbiddenException('Diese Provinz gehört dir nicht');
    }
    return province;
  }

  private kingdomResources(kingdom: {
    gold: number;
    food: number;
    wood: number;
    stone: number;
    iron: number;
    influence: number;
    fame: number;
  }) {
    return {
      gold: kingdom.gold,
      food: kingdom.food,
      wood: kingdom.wood,
      stone: kingdom.stone,
      iron: kingdom.iron,
      influence: kingdom.influence,
      fame: kingdom.fame,
    };
  }
}
