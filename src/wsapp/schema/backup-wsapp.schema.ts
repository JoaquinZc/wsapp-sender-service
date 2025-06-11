import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BackupWsappStatus = 'completed' | 'error';
export type BackupWsappDocument = HydratedDocument<
  BackupWsapp,
  { _id: string }
>;

@Schema({ _id: false })
export class BackupWsapp {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true })
  status: BackupWsappStatus;

  @Prop({ type: Date, required: true })
  modified: Date;
}

export const BackupWsappSchema = SchemaFactory.createForClass(BackupWsapp);
