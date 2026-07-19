import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HEIR_MIN_AGE, SuccessionResult, shouldRulerDieInBattle } from '@kronenchronik/shared';

@Injectable()
export class DynastyService {
  constructor(private prisma: PrismaService) {}

  async resolveSuccession(
    kingdomId: string,
    deceasedRulerId: string,
    reason: 'age' | 'battle' | 'natural',
  ): Promise<SuccessionResult | null> {
    const deceased = await this.prisma.character.findUnique({
      where: { id: deceasedRulerId },
    });
    if (!deceased || !deceased.isAlive) return null;

    await this.prisma.character.update({
      where: { id: deceasedRulerId },
      data: { isAlive: false, isRuler: false },
    });

    let heir = await this.prisma.character.findFirst({
      where: {
        kingdomId,
        isAlive: true,
        isHeir: true,
        age: { gte: HEIR_MIN_AGE },
      },
      orderBy: { age: 'desc' },
    });

    if (!heir) {
      heir = await this.prisma.character.findFirst({
        where: {
          kingdomId,
          isAlive: true,
          parentId: deceasedRulerId,
          age: { gte: HEIR_MIN_AGE },
        },
        orderBy: { martial: 'desc' },
      });
    }

    if (!heir) {
      const dynasty = await this.prisma.dynasty.findFirst({
        where: { kingdoms: { some: { id: kingdomId } } },
      });
      heir = await this.prisma.character.create({
        data: {
          name: `Erbe von ${deceased.name}`,
          age: 20,
          isRuler: true,
          isHeir: false,
          kingdomId,
          dynastyId: dynasty?.id,
          parentId: deceasedRulerId,
          martial: Math.max(5, deceased.martial - 2),
          diplomacy: Math.max(3, deceased.diplomacy - 1),
          stewardship: Math.max(3, deceased.stewardship - 1),
        },
      });
    } else {
      await this.prisma.character.update({
        where: { id: heir.id },
        data: { isRuler: true, isHeir: false },
      });
    }

    return {
      deceasedRulerId,
      newRulerId: heir.id,
      newRulerName: heir.name,
      reason,
    };
  }

  async createHeir(kingdomId: string, dynastyId: string, parentId: string, parentName: string) {
    const existingHeir = await this.prisma.character.findFirst({
      where: { kingdomId, isHeir: true, isAlive: true },
    });
    if (existingHeir) return existingHeir;

    return this.prisma.character.create({
      data: {
        name: `${parentName} Jr.`,
        age: 5,
        isRuler: false,
        isHeir: true,
        kingdomId,
        dynastyId,
        parentId,
        martial: 6,
        diplomacy: 5,
        stewardship: 5,
      },
    });
  }

  async getDynastyInfo(kingdomId: string) {
    const characters = await this.prisma.character.findMany({
      where: { kingdomId },
      orderBy: [{ isRuler: 'desc' }, { isHeir: 'desc' }, { age: 'desc' }],
    });

    const dynasty = await this.prisma.dynasty.findFirst({
      where: { kingdoms: { some: { id: kingdomId } } },
    });

    return {
      dynasty,
      characters: characters.map((c) => ({
        id: c.id,
        name: c.name,
        age: c.age,
        gender: c.gender,
        traits: c.traits,
        experience: c.experience,
        health: c.health,
        prestige: c.prestige,
        isAlive: c.isAlive,
        isRuler: c.isRuler,
        isHeir: c.isHeir,
        martial: c.martial,
        diplomacy: c.diplomacy,
        stewardship: c.stewardship,
        intrigue: c.intrigue,
      })),
      ruler: characters.find((c) => c.isRuler && c.isAlive) ?? null,
      heir: characters.find((c) => c.isHeir && c.isAlive) ?? null,
    };
  }

  async checkBattleDeath(kingdomId: string, rulerId: string): Promise<SuccessionResult | null> {
    if (!shouldRulerDieInBattle()) return null;
    return this.resolveSuccession(kingdomId, rulerId, 'battle');
  }
}
