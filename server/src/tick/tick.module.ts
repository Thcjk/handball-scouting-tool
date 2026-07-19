import { Module, forwardRef } from '@nestjs/common';
import { TickService } from './tick.service';
import { DynastyModule } from '../dynasty/dynasty.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [DynastyModule, forwardRef(() => GameModule)],
  providers: [TickService],
  exports: [TickService],
})
export class TickModule {}
