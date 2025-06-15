import { Injectable, Logger, Scope } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import { Wsapp, WsappStatus } from './interface/wsapp.interface';
import { MessageSender } from './interface/message-sender.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  MessageQuote,
  NEW_MESSAGE_EVENT_NAME,
  NewMessageEvent,
} from './event/new-message.event';
import { extension as mimeExtension } from 'mime-types';
import { getPublicPath } from 'src/commons/utils/get-public-path';
import { ConfigService } from '@nestjs/config';
import { writeFile } from 'src/commons/utils/write-file';

@Injectable({ scope: Scope.DEFAULT })
export class WsappService {
  private readonly wsapp: Client;
  private readonly client: Wsapp;
  private _onReady?: (isReady: boolean) => void;
  private meUrl: string;

  static timeoutLogin = 1000 * 60 * 2; // 2minutos

  constructor(
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService,
  ) {
    this.wsapp = new Client({
      authStrategy: new LocalAuth({
        clientId: 'sender-message',
      }),
      webVersionCache: {
        type: 'remote',
        remotePath:
          //'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014590669-alpha.html',
          'https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1023712139-alpha.html',
      },
      /* puppeteer: {
        //args: ["--no-sandbox"],
        executablePath: '/usr/bin/chromium-browser',
      }, */
    });

    this.meUrl = configService.getOrThrow('me.url');

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

  private async donwloadMediaMessage(media: MessageMedia, messageId: string) {
    const extension = mimeExtension(media.mimetype) || 'bin';
    const fileName = `${messageId}.${extension}`;
    const filePath = getPublicPath('./images/', fileName);

    try {
      // Escribir archivo en disco
      await writeFile(filePath, media.data, 'base64');
    } catch (_error) {
      return null;
    }

    return `${this.meUrl}/images/${fileName}`;
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

    this.wsapp.on('message_create', async (data) => {
      if (data.body === 'get-id-chat') {
        const chat = await data.getChat();
        return data.reply(chat.id._serialized);
      }
    });

    this.wsapp.on('message', async (data) => {
      const chat = await data.getChat();
      let mediaUrl: string | undefined = undefined;
      let messageQuote: MessageQuote | undefined = undefined;

      if (data.hasMedia) {
        const media = await data.downloadMedia();
        mediaUrl =
          (await this.donwloadMediaMessage(media, data.id._serialized)) ??
          undefined;
      }

      if (data.hasQuotedMsg) {
        const quote = await data.getQuotedMessage();

        messageQuote = {
          type: quote.type as string,
          messageId: data.id._serialized,
          author: data.author || data.from, // ID del autor (en grupo); si es individual, usa 'from'
          senderId: data.author || data.from,
          timestamp: data.timestamp,
          body: data.body,
        };
      }

      this.eventEmitter.emit(NEW_MESSAGE_EVENT_NAME, {
        messageId: data.id._serialized, // ID única del mensaje
        body: data.body, // Cuerpo del mensaje
        type: data.type as string, // Tipo (text, image, etc.)
        fromMe: data.fromMe, // Si lo envió el bot/usuario actual
        author: data.author || data.from, // ID del autor (en grupo); si es individual, usa 'from'
        senderId: data.author || data.from, // ID individual de quien envía
        chatId: chat.id._serialized, // ID del chat (individual o grupo)
        isGroup: chat.isGroup || chat.id.server === 'g.us', // Indica si es un grupo
        groupId: chat.isGroup ? chat.id._serialized : undefined,
        timestamp: data.timestamp, // Marca de tiempo UNIX
        hasMedia: data.hasMedia, // Si tiene medios
        isForwarded: data.isForwarded, // Si fue reenviado
        isEphemeral: data.isEphemeral, // Si es efímero
        mentionedIds: data.mentionedIds?.map((item) => item._serialized), // IDs mencionados
        groupMentions: data.groupMentions, // Menciones de grupo internas
        links: data.links,
        media: mediaUrl,
        quoute: messageQuote,
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
