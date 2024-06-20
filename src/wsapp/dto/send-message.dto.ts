import { IsString } from "class-validator";

export class SendMessageDto {
  @IsString()
  readonly destiny: string;

  @IsString()
  readonly message: string;
}