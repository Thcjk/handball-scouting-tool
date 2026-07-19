import { IsEnum, IsString, IsUUID } from 'class-validator';
import { DiplomaticStatus } from '@prisma/client';

export class DeclareWarDto {
  @IsUUID()
  targetKingdomId!: string;
}

export class ProposeAllianceDto {
  @IsUUID()
  targetKingdomId!: string;

  @IsString()
  allianceName!: string;
}

export class JoinAllianceDto {
  @IsUUID()
  allianceId!: string;
}

export class DiplomaticActionDto {
  @IsUUID()
  targetKingdomId!: string;

  @IsEnum(DiplomaticStatus)
  status!: DiplomaticStatus;
}

export class MakePeaceDto {
  @IsUUID()
  targetKingdomId!: string;
}
