import { Module } from '@nestjs/common';
import { RepeatersService } from './repeaters.service';
import { RepeatersController } from './repeaters.controller';
import { StorageRepository } from './repository/storage.repository';
import { StorageLocalRepository } from './repository/storage-local.repository';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    RepeatersService,
    {
      provide: StorageRepository,
      useClass: StorageLocalRepository,
    },
  ],
  controllers: [RepeatersController],
})
export class RepeatersModule {}
