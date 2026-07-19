import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { GameService } from '../game/game.service';
import { UNIT_DEFINITIONS, canAfford } from '@kronenchronik/shared';
import { BuildingType, UnitType } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private gameService: GameService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processAiTurns() {
    const aiKingdoms = await this.prisma.kingdom.findMany({
      where: { isAi: true },
      include: {
        provinces: {
          include: {
            castle: true,
            village: true,
            city: true,
            buildings: true,
            neighbors: { include: { neighbor: { include: { kingdom: true } } } },
          },
        },
        armies: { include: { units: true } },
        characters: { where: { isRuler: true, isAlive: true } },
      },
    });

    for (const kingdom of aiKingdoms) {
      try {
        await this.runAiTurn(kingdom);
      } catch (err) {
        this.logger.error(`AI turn failed for ${kingdom.name}`, err);
      }
    }
  }

  private async runAiTurn(
    kingdom: Awaited<ReturnType<typeof this.prisma.kingdom.findMany>>[0] & {
      provinces: Array<{
        id: string;
        kingdomId: string | null;
        buildings: Array<{ type: BuildingType; level: number }>;
        neighbors: Array<{ neighbor: { id: string; kingdomId: string | null; kingdom: { id: string; isAi: boolean } | null } }>;
      }>;
      armies: Array<{ id: string; isGarrison: boolean; provinceId: string; status: string; units: Array<{ type: UnitType; count: number }> }>;
    },
  ) {
    const capital = kingdom.provinces[0];
    if (!capital) return;

    // Rekrutierung wenn genug Gold
    if (kingdom.gold >= 100 && kingdom.food >= 50) {
      const unitType = kingdom.gold > 300 ? UnitType.SPEARMAN : UnitType.MILITIA;
      const def = UNIT_DEFINITIONS[unitType];
      const cost = { gold: def.gold * 5, food: def.food * 5, wood: def.wood * 5, stone: def.stone * 5, iron: def.iron * 5 };
      if (canAfford(kingdom, cost)) {
        await this.recruitForAi(kingdom.id, capital.id, unitType, 5);
      }
    }

    // Bauernhof bauen wenn wenig Nahrung
    if (kingdom.food < 150) {
      const hasFarm = capital.buildings.some((b) => b.type === BuildingType.FARM);
      if (!hasFarm && kingdom.wood >= 30) {
        await this.buildForAi(kingdom.id, capital.id, BuildingType.FARM);
      }
    }

    // Expansion: Angriff auf neutrale Nachbarprovinz
    const fieldArmy = kingdom.armies.find((a) => !a.isGarrison && a.status === 'IDLE' && a.units.length > 0);
    if (fieldArmy) {
      const totalTroops = fieldArmy.units.reduce((s, u) => s + u.count, 0);
      if (totalTroops >= 8) {
        const armyProvince = kingdom.provinces.find((p) => p.id === fieldArmy.provinceId) ?? capital;
        for (const { neighbor } of armyProvince.neighbors) {
          if (!neighbor.kingdomId) {
            await this.attackAsAi(kingdom.id, fieldArmy.id, neighbor.id);
            return;
          }
        }
      }
    }

    // Feldarmee erstellen wenn nur Garnison
    const garrison = kingdom.armies.find((a) => a.isGarrison && a.provinceId === capital.id);
    const garrisonTroops = garrison?.units.reduce((s, u) => s + u.count, 0) ?? 0;
    if (!fieldArmy && garrisonTroops >= 15) {
      await this.createFieldArmy(kingdom.id, capital.id);
    }
  }

  private async recruitForAi(kingdomId: string, provinceId: string, unitType: UnitType, count: number) {
    const kingdom = await this.prisma.kingdom.findUnique({ where: { id: kingdomId } });
    if (!kingdom) return;
    const def = UNIT_DEFINITIONS[unitType];
    await this.prisma.kingdom.update({
      where: { id: kingdomId },
      data: {
        gold: kingdom.gold - def.gold * count,
        food: kingdom.food - def.food * count,
        wood: kingdom.wood - def.wood * count,
        stone: kingdom.stone - def.stone * count,
        iron: kingdom.iron - def.iron * count,
      },
    });
    let garrison = await this.prisma.army.findFirst({
      where: { kingdomId, provinceId, isGarrison: true },
    });
    if (!garrison) {
      garrison = await this.prisma.army.create({
        data: { name: 'Garnison', kingdomId, provinceId, isGarrison: true },
      });
    }
    const existing = await this.prisma.unit.findUnique({
      where: { armyId_type: { armyId: garrison.id, type: unitType } },
    });
    if (existing) {
      await this.prisma.unit.update({
        where: { id: existing.id },
        data: { count: existing.count + count },
      });
    } else {
      await this.prisma.unit.create({ data: { armyId: garrison.id, type: unitType, count } });
    }
  }

  private async buildForAi(kingdomId: string, provinceId: string, type: BuildingType) {
    const kingdom = await this.prisma.kingdom.findUnique({ where: { id: kingdomId } });
    if (!kingdom) return;
    await this.prisma.kingdom.update({
      where: { id: kingdomId },
      data: { wood: kingdom.wood - 30, stone: kingdom.stone - 10 },
    });
    await this.prisma.building.create({ data: { provinceId, type, level: 1 } });
  }

  private async createFieldArmy(kingdomId: string, provinceId: string) {
    const garrison = await this.prisma.army.findFirst({
      where: { kingdomId, provinceId, isGarrison: true },
      include: { units: true },
    });
    if (!garrison?.units.length) return;
    await this.prisma.army.create({
      data: {
        name: 'Feldzug',
        kingdomId,
        provinceId,
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
      const transfer = Math.floor(unit.count / 2) || 1;
      await this.prisma.unit.update({
        where: { id: unit.id },
        data: { count: Math.max(0, unit.count - transfer) },
      });
    }
  }

  private async attackAsAi(kingdomId: string, armyId: string, targetProvinceId: string) {
    // AI bypasses diplomacy checks for neutral provinces
    const army = await this.prisma.army.findUnique({
      where: { id: armyId },
      include: { units: true },
    });
    if (!army) return;

    const target = await this.prisma.province.findUnique({
      where: { id: targetProvinceId },
      include: { castle: true, armies: { include: { units: true } }, kingdom: true },
    });
    if (!target || target.kingdomId) return;

    // Use internal attack logic via game service - need a method for AI
    await this.gameService.executeAttack(kingdomId, armyId, targetProvinceId, true);
  }
}
