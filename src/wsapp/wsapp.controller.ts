import { Body, Controller, Delete, Get, HttpException, HttpStatus, Post, Res, StreamableFile } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { image as convertTextoToImageQR } from 'qr-image';

import { WsappService } from './wsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Response } from 'express';

@Controller('wsapp')
export class WsappController {
  constructor(
    private readonly wsappService: WsappService,
    @InjectQueue('wsapp') private readonly messageQueue: Queue<SendMessageDto>,
  ) {}

  @Post()
  init() {
    this.wsappService.init();
  }

  @Post("send")
  async sendMessage(@Body() data: SendMessageDto) {
    const job = await this.messageQueue.add("message", data);

    /* const completed = await job.isCompleted()

    if(!completed) {
      throw new HttpException("La tarea no se ha completado.", HttpStatus.GATEWAY_TIMEOUT);
    } */
  }

  @Get()
  getQr(
    @Res() res: Response,
  ) {
    const qr = this.wsappService.getQr();

    if(!qr) {
      throw new HttpException("El QR no está disponible.", HttpStatus.NOT_ACCEPTABLE);
    }

    const image = convertTextoToImageQR(qr, { type: "png", ec_level: "Q" });
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="qrcode.png"',
    });

    image.on('end', () => {
      res.end();
    });

    image.pipe(res)
  }

  @Delete()
  async end() {
    await this.wsappService.logut();
  }
}
