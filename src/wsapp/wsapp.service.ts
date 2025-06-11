import { Injectable, Logger, Scope } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { Wsapp, WsappStatus } from './interface/wsapp.interface';
import { MessageSender } from './interface/message-sender.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NEW_MESSAGE_EVENT_NAME,
  NewMessageEvent,
} from './event/new-message.event';

@Injectable({ scope: Scope.DEFAULT })
export class WsappService {
  private readonly wsapp: Client;
  private readonly client: Wsapp;
  private _onReady?: (isReady: boolean) => void;

  static timeoutLogin = 1000 * 60 * 2; // 2minutos

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.wsapp = new Client({
      authStrategy: new LocalAuth({
        clientId: 'sender-message',
      }),
      webVersionCache: {
        type: 'remote',
        remotePath:
          'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014590669-alpha.html',
      },
      /* puppeteer: {
        args: ["--no-sandbox"]
      } */
    });

    this.client = {
      status: WsappStatus.OFF,
    };

    // Se inicializará por defecto.
    this.init();
  }

  public getQr(): string | undefined {
    if (this.client.status === WsappStatus.WAITNG) {
      return this.client.qrCode;
    }

    return undefined;
  }

  public setHandleReady(func: typeof this._onReady) {
    this._onReady = func;
  }

  public init(): void {
    // Si el estado no es apagado, entonces
    // no se necesita inicializar

    if (this.client.status !== WsappStatus.OFF) {
      return;
    }

    // Aquí se inicializa el chromium y pueden pasar dos cosas
    // -> Tener una sesión ya registrada y válida, por lo cual pasa directamente
    //    al estado de estar conectado
    // -> Comenzar a generar códigos QR
    this.wsapp.initialize();

    // Cambiamos el estado
    this.client.status = WsappStatus.WAITNG;
    Logger.log('>> [Wsapp service]: Is Waiting...');

    // Creamos el Timeout, si no se cumple en cierto tiempo finaliza el servicio
    // y se requiere volver a iniciar
    const timer = setTimeout(() => this.end(), WsappService.timeoutLogin);

    // Escuchamos una vez el evento "ready" apartir del momento que se inicia,
    // si el evento pasa a "ready" que sería ya con la cuenta iniciada
    // entonces cambiará el estado y eliminará el timeout
    this.wsapp.once('ready', () => {
      Logger.log('>> [Wsapp service]: Is ready');
      this.client.status = WsappStatus.READY;
      this._onReady && this._onReady(true);
      clearTimeout(timer);
    });

    this.wsapp.on('message_create', (data) => {
      if (data.body === 'get-id-chat') {
        return data.reply(data.from || data.to);
      }
    });

    this.wsapp.on('message', (data) => {
      this.eventEmitter.emit(NEW_MESSAGE_EVENT_NAME, {
        body: data.body,
        fromMe: data.fromMe,
        type: data.type,
        author: data.author,
        from: data.from,
        to: data.to,
      } as NewMessageEvent);
    });

    // Inicializar los eventos por defecto de control
    this.initEvents();
  }

  public async logut(): Promise<void> {
    await this.wsapp.logout();
    await this.end();
  }

  public async end(): Promise<void> {
    await this.wsapp.destroy();
    this.client.status = WsappStatus.OFF;
    Logger.log('>> [Wsapp service]: Is end.');
    this._onReady && this._onReady(false);

    // Eliminar los eventos.
    this.removeEvents();
  }

  private initEvents(): void {
    this.wsapp.addListener('qr', (qr: string) => {
      Logger.log(`>> [Wsapp service]: QR ${qr}`);
      this.client.qrCode = qr;
    });

    this.wsapp.addListener('disconnected', () => this.end());
  }

  private removeEvents(): void {
    this.wsapp.removeAllListeners('qr');
    this.wsapp.removeAllListeners('disconnected');
    this.wsapp.removeAllListeners('ready');
  }

  public async sendMessage(message: MessageSender): Promise<boolean> {
    const normalize = { ...message };

    if (normalize.destiny.indexOf('@c.us') === -1) {
      normalize.destiny = `${normalize.destiny}@c.us`;
    }

    if (normalize.destiny.at(0) === '0') {
      normalize.destiny = `593${normalize.destiny.slice(1, normalize.destiny.length)}`;
    }

    try {
      await this.wsapp.sendSeen(normalize.destiny);
      await this.wsapp.sendMessage(normalize.destiny, normalize.message);
    } catch (e) {
      return false;
    }

    return true;
  }
}
