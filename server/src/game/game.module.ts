import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { DynastyModule } from '../dynasty/dynasty.module';
import { DiplomacyModule } from '../diplomacy/diplomacy.module';
import { TickModule } from '../tick/tick.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    DynastyModule,
    forwardRef(() => DiplomacyModule),
    forwardRef(() => TickModule),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService, GameGateway],
})
export class GameModule {}
