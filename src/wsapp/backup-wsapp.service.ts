import { Injectable, Scope } from '@nestjs/common';
import { BackupWsapp, BackupWsappStatus } from './schema/backup-wsapp.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SyncBackupDto } from './dto/sync-backup.dto';
import { Cron } from '@nestjs/schedule';

@Injectable({ scope: Scope.DEFAULT })
export class BackupWsappService {
  constructor(
    @InjectModel(BackupWsapp.name) private backupWsappModel: Model<BackupWsapp>,
  ) {}

  async sync(syncDto: SyncBackupDto): Promise<BackupWsapp> {
    const response = await this.backupWsappModel.findOneAndUpdate(
      {
        _id: syncDto.id,
      },
      {
        status: syncDto.status,
        modified: syncDto.modified,
      },
      {
        upsert: true,
        new: true,
      },
    );

    return response;
  }

  async getStatus(id: string): Promise<BackupWsappStatus | 'none'> {
    const response = await this.backupWsappModel.findOne({ _id: id }).exec();

    if (!response) {
      return 'none';
    }

    return response.status;
  }

  @Cron('0 0 23 * * *')
  async clearDb(): Promise<void> {
    await this.backupWsappModel.deleteMany({});
  }
}
