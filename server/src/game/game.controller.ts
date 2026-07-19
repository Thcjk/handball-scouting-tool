import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  BuildDto,
  RecruitDto,
  CreateArmyDto,
  AttackDto,
  UpgradeCastleDto,
  FoundCityDto,
  UpgradeCityDto,
  MarchDto,
} from './dto/game.dto';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}

  @Get('state')
  getState(@Request() req: { user: { id: string } }) {
    return this.gameService.getGameState(req.user.id);
  }

  @Post('build')
  build(@Request() req: { user: { id: string } }, @Body() dto: BuildDto) {
    return this.gameService.buildBuilding(req.user.id, dto);
  }

  @Post('recruit')
  recruit(@Request() req: { user: { id: string } }, @Body() dto: RecruitDto) {
    return this.gameService.recruitUnits(req.user.id, dto);
  }

  @Post('army')
  createArmy(@Request() req: { user: { id: string } }, @Body() dto: CreateArmyDto) {
    return this.gameService.createArmy(req.user.id, dto);
  }

  @Post('castle/upgrade')
  upgradeCastle(@Request() req: { user: { id: string } }, @Body() dto: UpgradeCastleDto) {
    return this.gameService.upgradeCastle(req.user.id, dto);
  }

  @Post('city/found')
  foundCity(@Request() req: { user: { id: string } }, @Body() dto: FoundCityDto) {
    return this.gameService.foundCity(req.user.id, dto);
  }

  @Post('city/upgrade')
  upgradeCity(@Request() req: { user: { id: string } }, @Body() dto: UpgradeCityDto) {
    return this.gameService.upgradeCity(req.user.id, dto);
  }

  @Post('attack')
  attack(@Request() req: { user: { id: string } }, @Body() dto: AttackDto) {
    return this.gameService.attackProvince(req.user.id, dto);
  }

  @Post('march')
  march(@Request() req: { user: { id: string } }, @Body() dto: MarchDto) {
    return this.gameService.marchArmy(req.user.id, dto);
  }
}
