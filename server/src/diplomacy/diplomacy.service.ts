import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiplomaticStatus } from '@prisma/client';
import { DIPLOMACY_COSTS } from '@kronenchronik/shared';
import {
  DeclareWarDto,
  ProposeAllianceDto,
  JoinAllianceDto,
  MakePeaceDto,
} from './dto/diplomacy.dto';
import { GameGateway } from '../game/game.gateway';

@Injectable()
export class DiplomacyService {
  constructor(
    private prisma: PrismaService,
    private gameGateway: GameGateway,
  ) {}

  async getDiplomacyState(userId: string) {
    const kingdom = await this.getKingdomByUser(userId);

    const relations = await this.prisma.diplomaticRelation.findMany({
      where: { OR: [{ kingdomAId: kingdom.id }, { kingdomBId: kingdom.id }] },
      include: {
        kingdomA: { select: { id: true, name: true } },
        kingdomB: { select: { id: true, name: true } },
      },
    });

    const allKingdoms = await this.prisma.kingdom.findMany({
      where: { id: { not: kingdom.id } },
      select: { id: true, name: true, fame: true, user: { select: { username: true } } },
    });

    const alliances = await this.prisma.alliance.findMany({
      include: {
        members: {
          include: { kingdom: { select: { id: true, name: true } } },
        },
      },
    });

    const myAlliance = alliances.find((a) => a.members.some((m) => m.kingdomId === kingdom.id));

    return {
      relations: relations.map((r) => ({
        id: r.id,
        status: r.status,
        partner: r.kingdomAId === kingdom.id ? r.kingdomB : r.kingdomA,
        partnerId: r.kingdomAId === kingdom.id ? r.kingdomBId : r.kingdomAId,
      })),
      kingdoms: allKingdoms,
      myAlliance: myAlliance
        ? {
            id: myAlliance.id,
            name: myAlliance.name,
            members: myAlliance.members.map((m) => m.kingdom),
          }
        : null,
      availableAlliances: alliances
        .filter((a) => !a.members.some((m) => m.kingdomId === kingdom.id))
        .map((a) => ({
          id: a.id,
          name: a.name,
          memberCount: a.members.length,
        })),
    };
  }

  async declareWar(userId: string, dto: DeclareWarDto) {
    const kingdom = await this.getKingdomByUser(userId);
    if (dto.targetKingdomId === kingdom.id) {
      throw new BadRequestException('Du kannst dir nicht selbst den Krieg erklären');
    }

    const target = await this.prisma.kingdom.findUnique({
      where: { id: dto.targetKingdomId },
      include: { user: true },
    });
    if (!target) throw new NotFoundException('Königreich nicht gefunden');

    if (kingdom.influence < DIPLOMACY_COSTS.declareWar.influence) {
      throw new BadRequestException('Nicht genügend Einfluss');
    }

    const existing = await this.findRelation(kingdom.id, dto.targetKingdomId);
    if (existing?.status === DiplomaticStatus.ALLIED) {
      throw new ForbiddenException(
        'Alliierte können nicht angegriffen werden. Brich zuerst das Bündnis.',
      );
    }

    await this.upsertRelation(kingdom.id, dto.targetKingdomId, DiplomaticStatus.AT_WAR);

    await this.prisma.kingdom.update({
      where: { id: kingdom.id },
      data: { influence: { decrement: DIPLOMACY_COSTS.declareWar.influence } },
    });

    this.gameGateway.emitToUser(target.userId, 'diplomacyEvent', {
      type: 'war_declared',
      from: kingdom.name,
    });

    return this.getDiplomacyState(userId);
  }

  async makePeace(userId: string, dto: MakePeaceDto) {
    const kingdom = await this.getKingdomByUser(userId);

    if (kingdom.influence < DIPLOMACY_COSTS.makePeace.influence) {
      throw new BadRequestException('Nicht genügend Einfluss');
    }

    const relation = await this.findRelation(kingdom.id, dto.targetKingdomId);
    if (!relation || relation.status !== DiplomaticStatus.AT_WAR) {
      throw new BadRequestException('Kein aktiver Krieg mit diesem Königreich');
    }

    await this.upsertRelation(kingdom.id, dto.targetKingdomId, DiplomaticStatus.NEUTRAL);

    await this.prisma.kingdom.update({
      where: { id: kingdom.id },
      data: { influence: { decrement: DIPLOMACY_COSTS.makePeace.influence } },
    });

    return this.getDiplomacyState(userId);
  }

  async proposeAlliance(userId: string, dto: ProposeAllianceDto) {
    const kingdom = await this.getKingdomByUser(userId);

    if (kingdom.influence < DIPLOMACY_COSTS.proposeAlliance.influence) {
      throw new BadRequestException('Nicht genügend Einfluss');
    }

    const existingMembership = await this.prisma.allianceMember.findUnique({
      where: { kingdomId: kingdom.id },
    });
    if (existingMembership) {
      throw new BadRequestException('Du bist bereits in einem Bündnis');
    }

    const alliance = await this.prisma.alliance.create({
      data: {
        name: dto.allianceName,
        members: {
          create: [{ kingdomId: kingdom.id }],
        },
      },
    });

    await this.upsertRelation(kingdom.id, dto.targetKingdomId, DiplomaticStatus.ALLIED);

    await this.prisma.kingdom.update({
      where: { id: kingdom.id },
      data: { influence: { decrement: DIPLOMACY_COSTS.proposeAlliance.influence } },
    });

    return { alliance, diplomacy: await this.getDiplomacyState(userId) };
  }

  async joinAlliance(userId: string, dto: JoinAllianceDto) {
    const kingdom = await this.getKingdomByUser(userId);

    const existing = await this.prisma.allianceMember.findUnique({
      where: { kingdomId: kingdom.id },
    });
    if (existing) throw new BadRequestException('Bereits in einem Bündnis');

    const alliance = await this.prisma.alliance.findUnique({
      where: { id: dto.allianceId },
      include: { members: true },
    });
    if (!alliance) throw new NotFoundException('Bündnis nicht gefunden');

    await this.prisma.allianceMember.create({
      data: { allianceId: dto.allianceId, kingdomId: kingdom.id },
    });

    for (const member of alliance.members) {
      await this.upsertRelation(kingdom.id, member.kingdomId, DiplomaticStatus.ALLIED);
    }

    return this.getDiplomacyState(userId);
  }

  async proposeTrade(userId: string, targetKingdomId: string) {
    const kingdom = await this.getKingdomByUser(userId);

    if (kingdom.influence < DIPLOMACY_COSTS.proposeTrade.influence) {
      throw new BadRequestException('Nicht genügend Einfluss');
    }

    await this.upsertRelation(kingdom.id, targetKingdomId, DiplomaticStatus.TRADE_PACT);

    await this.prisma.kingdom.update({
      where: { id: kingdom.id },
      data: { influence: { decrement: DIPLOMACY_COSTS.proposeTrade.influence } },
    });

    return this.getDiplomacyState(userId);
  }

  async canAttack(
    attackerId: string,
    defenderId: string | null,
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!defenderId) return { allowed: true };

    const relation = await this.findRelation(attackerId, defenderId);
    if (relation?.status === DiplomaticStatus.ALLIED) {
      return { allowed: false, reason: 'Alliierte können nicht angegriffen werden' };
    }
    if (relation?.status === DiplomaticStatus.AT_WAR) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Krieg muss zuerst erklärt werden (Diplomatie → Krieg erklären)',
    };
  }

  private async findRelation(kingdomAId: string, kingdomBId: string) {
    const [a, b] = kingdomAId < kingdomBId ? [kingdomAId, kingdomBId] : [kingdomBId, kingdomAId];
    return this.prisma.diplomaticRelation.findUnique({
      where: { kingdomAId_kingdomBId: { kingdomAId: a, kingdomBId: b } },
    });
  }

  private async upsertRelation(kingdomAId: string, kingdomBId: string, status: DiplomaticStatus) {
    const [a, b] = kingdomAId < kingdomBId ? [kingdomAId, kingdomBId] : [kingdomBId, kingdomAId];
    return this.prisma.diplomaticRelation.upsert({
      where: { kingdomAId_kingdomBId: { kingdomAId: a, kingdomBId: b } },
      update: { status },
      create: { kingdomAId: a, kingdomBId: b, status },
    });
  }

  private async getKingdomByUser(userId: string) {
    const kingdom = await this.prisma.kingdom.findUnique({ where: { userId } });
    if (!kingdom) throw new NotFoundException('Kein Königreich gefunden');
    return kingdom;
  }
}
