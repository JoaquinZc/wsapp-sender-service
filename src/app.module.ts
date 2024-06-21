import { Module } from '@nestjs/common';
import { WsappModule } from './wsapp/wsapp.module';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import loadConfig from "./load.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ loadConfig ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService
      ) => ({
        redis: {
          host: configService.get("redis.host", "localhost"),
          port: configService.get("redis.port", 6381),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
      }),
    }),
    WsappModule,
  ],
})
export class AppModule {}
