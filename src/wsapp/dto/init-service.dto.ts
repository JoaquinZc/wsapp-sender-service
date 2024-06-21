import { IsString } from "class-validator";

export class InitServiceDto {
  @IsString()
  readonly password: string;
}