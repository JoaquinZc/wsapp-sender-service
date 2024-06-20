import { Module } from '@nestjs/common';
import { WsappModule } from './wsapp/wsapp.module';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? "6381")
      },
    }),
    WsappModule,
  ],
})
export class AppModule {}
