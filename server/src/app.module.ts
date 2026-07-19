import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GameModule } from './game/game.module';
import { DynastyModule } from './dynasty/dynasty.module';
import { DiplomacyModule } from './diplomacy/diplomacy.module';
import { TickModule } from './tick/tick.module';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    DynastyModule,
    DiplomacyModule,
    TickModule,
    AiModule,
    GameModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
