import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, UpdateProfileDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        kingdom: {
          include: {
            dynasty: true,
            characters: { where: { isRuler: true, isAlive: true } },
            provinces: {
              include: { castle: true, village: true, city: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Benutzer nicht gefunden');
    return this.formatProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findFirst({
      where: { username: dto.username, NOT: { id: userId } },
    });
    if (existing) {
      throw new UnauthorizedException('Benutzername bereits vergeben');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { username: dto.username },
    });

    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Aktuelles Passwort ist falsch');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Passwort erfolgreich geändert' };
  }

  private formatProfile(user: {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
    kingdom: {
      id: string;
      name: string;
      gold: number;
      food: number;
      wood: number;
      stone: number;
      iron: number;
      influence: number;
      fame: number;
      dynasty: { id: string; name: string; motto: string | null } | null;
      characters: Array<{ id: string; name: string; age: number; martial: number }>;
      provinces: Array<{
        id: string;
        name: string;
        castle: { level: number } | null;
        village: { level: number } | null;
        city: { level: number } | null;
      }>;
    } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      kingdom: user.kingdom
        ? {
            id: user.kingdom.id,
            name: user.kingdom.name,
            resources: {
              gold: user.kingdom.gold,
              food: user.kingdom.food,
              wood: user.kingdom.wood,
              stone: user.kingdom.stone,
              iron: user.kingdom.iron,
              influence: user.kingdom.influence,
              fame: user.kingdom.fame,
            },
            dynasty: user.kingdom.dynasty,
            ruler: user.kingdom.characters[0] ?? null,
            provinceCount: user.kingdom.provinces.length,
            provinces: user.kingdom.provinces,
          }
        : null,
    };
  }
}
