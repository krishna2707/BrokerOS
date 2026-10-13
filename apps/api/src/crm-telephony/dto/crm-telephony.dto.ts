import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { VoiceTelephonyType } from '@brokeros/prisma';

export class ConnectCrmTelephonyDto {
  @IsEnum(VoiceTelephonyType)
  @IsNotEmpty()
  provider: VoiceTelephonyType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  accountSid?: string;

  @IsString()
  @IsOptional()
  authToken?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  apiToken?: string;

  @IsString()
  @IsOptional()
  subdomain?: string;

  @IsString()
  @IsOptional()
  sipDomain?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fromNumbers?: string[];

  @IsString()
  @IsOptional()
  applicationSid?: string;
}

export class InitiateCrmCallDto {
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  brokerId?: string;
}

export class HangupCrmCallDto {
  @IsString()
  @IsNotEmpty()
  callRecordId: string;
}

export class VerifyCrmTelephonyDto {
  @IsString()
  @IsNotEmpty()
  toPhone: string;

  @IsString()
  @IsOptional()
  fromNumber?: string;
}
