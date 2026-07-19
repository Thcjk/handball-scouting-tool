import { Module, forwardRef } from '@nestjs/common';
import { DiplomacyService } from './diplomacy.service';
import { DiplomacyController } from './diplomacy.controller';
import { GameModule } from '../game/game.module';

@Module({
  imports: [forwardRef(() => GameModule)],
  controllers: [DiplomacyController],
  providers: [DiplomacyService],
  exports: [DiplomacyService],
})
export class DiplomacyModule {}
