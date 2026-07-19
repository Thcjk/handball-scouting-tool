import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { STARTING_RESOURCES } from '@kronenchronik/shared';
import { DynastyService } from '../dynasty/dynasty.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private dynastyService: DynastyService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new UnauthorizedException('E-Mail oder Benutzername bereits vergeben');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const availableProvince = await this.prisma.province.findFirst({
      where: { kingdomId: null },
      orderBy: { population: 'desc' },
    });

    if (!availableProvince) {
      throw new UnauthorizedException('Keine freien Provinzen verfügbar');
    }

    const dynasty = await this.prisma.dynasty.create({
      data: { name: `Haus ${dto.rulerName}`, motto: 'Stärke durch Ehre' },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        kingdom: {
          create: {
            name: dto.kingdomName,
            gold: STARTING_RESOURCES.gold,
            food: STARTING_RESOURCES.food,
            wood: STARTING_RESOURCES.wood,
            stone: STARTING_RESOURCES.stone,
            iron: STARTING_RESOURCES.iron,
            influence: STARTING_RESOURCES.influence,
            fame: STARTING_RESOURCES.fame,
            dynastyId: dynasty.id,
            characters: {
              create: {
                name: dto.rulerName,
                isRuler: true,
                dynastyId: dynasty.id,
                martial: 10,
                diplomacy: 7,
                stewardship: 8,
              },
            },
          },
        },
      },
      include: { kingdom: true },
    });

    await this.prisma.province.update({
      where: { id: availableProvince.id },
      data: {
        kingdomId: user.kingdom!.id,
        castle: { create: { level: 1 } },
        village: { create: { level: 1 } },
        city: { create: { level: 0 } },
      },
    });

    await this.prisma.army.create({
      data: {
        name: 'Garnison',
        kingdomId: user.kingdom!.id,
        provinceId: availableProvince.id,
        isGarrison: true,
        units: {
          create: [
            { type: 'MILITIA', count: 10 },
            { type: 'SPEARMAN', count: 5 },
          ],
        },
      },
    });

    const ruler = await this.prisma.character.findFirst({
      where: { kingdomId: user.kingdom!.id, isRuler: true },
    });
    if (ruler) {
      await this.dynastyService.createHeir(user.kingdom!.id, dynasty.id, ruler.id, dto.rulerName);
    }

    const token = this.generateToken(user.id, user.email);
    return { accessToken: token, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { kingdom: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }

    const token = this.generateToken(user.id, user.email);
    return { accessToken: token, user: this.sanitizeUser(user) };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { kingdom: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  private generateToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }

  private sanitizeUser(user: { id: string; email: string; username: string; kingdom?: unknown }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      hasKingdom: !!user.kingdom,
    };
  }
}
