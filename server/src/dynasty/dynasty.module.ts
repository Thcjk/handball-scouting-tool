import { Module } from '@nestjs/common';
import { DynastyService } from './dynasty.service';
import { DynastyController } from './dynasty.controller';

@Module({
  controllers: [DynastyController],
  providers: [DynastyService],
  exports: [DynastyService],
})
export class DynastyModule {}
