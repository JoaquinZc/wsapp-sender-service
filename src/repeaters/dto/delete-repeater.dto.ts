import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteRepeaterDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}
