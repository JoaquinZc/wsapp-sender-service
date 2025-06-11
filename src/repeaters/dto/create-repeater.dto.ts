import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateRepeater } from 'src/repeaters/interfaces/create-repeater.interface';

export class CreateRepeaterDto implements CreateRepeater {
  @IsNotEmpty()
  @IsString()
  receiverHttp: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscribed?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excluding?: string[];
}
