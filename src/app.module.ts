import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { WsappModule } from './wsapp/wsapp.module';
import loadConfig from './load.config';
import { ScheduleModule } from '@nestjs/schedule';
import { RepeatersModule } from './repeaters/repeaters.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { getPublicPath } from './commons/utils/get-public-path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
    }),
    ServeStaticModule.forRoot({
      rootPath: getPublicPath(),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host', 'localhost'),
          port: configService.get('redis.port', 6381),
        },
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('mongo.uri'),
      }),
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    WsappModule,
    RepeatersModule,
  ],
})
export class AppModule {}
