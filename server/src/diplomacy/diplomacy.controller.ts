import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DiplomacyService } from './diplomacy.service';
import {
  DeclareWarDto,
  ProposeAllianceDto,
  JoinAllianceDto,
  MakePeaceDto,
} from './dto/diplomacy.dto';

@Controller('diplomacy')
@UseGuards(JwtAuthGuard)
export class DiplomacyController {
  constructor(private diplomacyService: DiplomacyService) {}

  @Get()
  getState(@Request() req: { user: { id: string } }) {
    return this.diplomacyService.getDiplomacyState(req.user.id);
  }

  @Post('war')
  declareWar(@Request() req: { user: { id: string } }, @Body() dto: DeclareWarDto) {
    return this.diplomacyService.declareWar(req.user.id, dto);
  }

  @Post('peace')
  makePeace(@Request() req: { user: { id: string } }, @Body() dto: MakePeaceDto) {
    return this.diplomacyService.makePeace(req.user.id, dto);
  }

  @Post('alliance')
  proposeAlliance(@Request() req: { user: { id: string } }, @Body() dto: ProposeAllianceDto) {
    return this.diplomacyService.proposeAlliance(req.user.id, dto);
  }

  @Post('alliance/join')
  joinAlliance(@Request() req: { user: { id: string } }, @Body() dto: JoinAllianceDto) {
    return this.diplomacyService.joinAlliance(req.user.id, dto);
  }

  @Post('trade')
  proposeTrade(
    @Request() req: { user: { id: string } },
    @Body() body: { targetKingdomId: string },
  ) {
    return this.diplomacyService.proposeTrade(req.user.id, body.targetKingdomId);
  }
}
