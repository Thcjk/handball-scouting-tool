import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateProvinceIncome,
  calculateUpkeep,
  ACTIVE_PLAYER_WINDOW_MS,
  shouldRulerDieFromAge,
  TICK_AGE_INTERVAL,
  BuildingType as SharedBuildingType,
  UnitType as SharedUnitType,
} from '@kronenchronik/shared';
import { DynastyService } from '../dynasty/dynasty.service';
import { GameGateway } from '../game/game.gateway';
import { GameService } from '../game/game.service';
import { BuildingType, UnitType } from '@prisma/client';

@Injectable()
export class TickService {
  private readonly logger = new Logger(TickService.name);
  private tickCount = 0;

  constructor(
    private prisma: PrismaService,
    private dynastyService: DynastyService,
    private gameGateway: GameGateway,
    private gameService: GameService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processTicks() {
    await this.gameService.processMarches();
    const activeSince = new Date(Date.now() - ACTIVE_PLAYER_WINDOW_MS);
    const activeUsers = await this.prisma.user.findMany({
      where: { lastSeen: { gte: activeSince }, kingdom: { isNot: null } },
      include: {
        kingdom: {
          include: {
            provinces: { include: { buildings: true, city: true, village: true } },
            armies: { include: { units: true } },
            characters: { where: { isAlive: true } },
          },
        },
      },
    });

    this.tickCount++;

    for (const user of activeUsers) {
      const kingdom = user.kingdom!;
      try {
        await this.tickKingdom(kingdom, user.id);
      } catch (err) {
        this.logger.error(`Tick failed for kingdom ${kingdom.id}`, err);
      }
    }
  }

  async tickKingdom(
    kingdom: {
      id: string;
      gold: number;
      food: number;
      wood: number;
      stone: number;
      iron: number;
      influence: number;
      fame: number;
      provinces: Array<{
        population: number;
        buildings: Array<{ type: BuildingType; level: number }>;
        city: { level: number } | null;
        village: { level: number } | null;
      }>;
      armies: Array<{ units: Array<{ type: UnitType; count: number }> }>;
      characters: Array<{ id: string; age: number; isRuler: boolean }>;
    },
    userId: string,
  ) {
    const totalIncome = { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, influence: 0, fame: 0 };

    for (const province of kingdom.provinces) {
      const income = calculateProvinceIncome({
        buildings: province.buildings.map((b) => ({
          type: b.type as unknown as SharedBuildingType,
          level: b.level,
        })),
        population: province.population,
        cityLevel: province.city?.level ?? 0,
        villageLevel: province.village?.level ?? 0,
      });
      totalIncome.gold += income.gold ?? 0;
      totalIncome.food += income.food ?? 0;
      totalIncome.wood += income.wood ?? 0;
      totalIncome.stone += income.stone ?? 0;
      totalIncome.iron += income.iron ?? 0;
      totalIncome.influence += income.influence ?? 0;
    }

    const allUnits = kingdom.armies.flatMap((a) => a.units);
    const upkeep = calculateUpkeep(
      allUnits.map((u) => ({ type: u.type as unknown as SharedUnitType, count: u.count })),
    );

    const newGold = Math.max(0, kingdom.gold + totalIncome.gold - (upkeep.gold ?? 0));
    const newFood = Math.max(0, kingdom.food + totalIncome.food - (upkeep.food ?? 0));

    await this.prisma.kingdom.update({
      where: { id: kingdom.id },
      data: {
        gold: newGold,
        food: newFood,
        wood: kingdom.wood + totalIncome.wood,
        stone: kingdom.stone + totalIncome.stone,
        iron: kingdom.iron + totalIncome.iron,
        influence: kingdom.influence + totalIncome.influence,
        lastTickAt: new Date(),
      },
    });

    if (this.tickCount % TICK_AGE_INTERVAL === 0) {
      for (const char of kingdom.characters) {
        const newAge = char.age + 1;
        await this.prisma.character.update({
          where: { id: char.id },
          data: { age: newAge },
        });

        if (char.isRuler && shouldRulerDieFromAge(newAge)) {
          const result = await this.dynastyService.resolveSuccession(kingdom.id, char.id, 'age');
          if (result) {
            this.gameGateway.emitToUser(userId, 'succession', result);
          }
        }
      }
    }

    this.gameGateway.emitToUser(userId, 'resourceTick', {
      income: totalIncome,
      upkeep,
      resources: {
        gold: newGold,
        food: newFood,
        wood: kingdom.wood + totalIncome.wood,
        stone: kingdom.stone + totalIncome.stone,
        iron: kingdom.iron + totalIncome.iron,
        influence: kingdom.influence + totalIncome.influence,
        fame: kingdom.fame,
      },
    });
  }

  async markActive(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() },
    });
  }
}
