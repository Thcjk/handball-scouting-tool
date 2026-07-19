import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { GameModule } from '../game/game.module';

@Module({
  imports: [forwardRef(() => GameModule)],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
