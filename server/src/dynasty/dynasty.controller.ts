import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DynastyService } from './dynasty.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dynasty')
@UseGuards(JwtAuthGuard)
export class DynastyController {
  constructor(
    private dynastyService: DynastyService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async getDynasty(@Request() req: { user: { id: string } }) {
    const kingdom = await this.prisma.kingdom.findUnique({
      where: { userId: req.user.id },
    });
    if (!kingdom) return null;
    return this.dynastyService.getDynastyInfo(kingdom.id);
  }
}
