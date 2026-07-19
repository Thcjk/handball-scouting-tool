import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { BuildingType, UnitType } from '@prisma/client';

export class BuildDto {
  @IsUUID()
  provinceId!: string;

  @IsEnum(BuildingType)
  buildingType!: BuildingType;
}

export class RecruitDto {
  @IsUUID()
  provinceId!: string;

  @IsEnum(UnitType)
  unitType!: UnitType;

  @IsInt()
  @Min(1)
  count!: number;
}

export class CreateArmyDto {
  @IsString()
  name!: string;

  @IsUUID()
  provinceId!: string;

  @IsOptional()
  units?: Array<{ type: UnitType; count: number }>;
}

export class AttackDto {
  @IsUUID()
  armyId!: string;

  @IsUUID()
  targetProvinceId!: string;
}

export class UpgradeCastleDto {
  @IsUUID()
  provinceId!: string;
}

export class FoundCityDto {
  @IsUUID()
  provinceId!: string;
}

export class UpgradeCityDto {
  @IsUUID()
  provinceId!: string;
}
