import { BackupWsappStatus } from '../schema/backup-wsapp.schema';

export class SyncBackupDto {
  public readonly modified: Date;

  constructor(
    public readonly id: string,
    public readonly status: BackupWsappStatus,
  ) {
    this.modified = new Date();
  }
}
