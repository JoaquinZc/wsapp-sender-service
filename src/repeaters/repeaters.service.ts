import { Injectable, Logger } from '@nestjs/common';
import { CreateRepeater } from './interfaces/create-repeater.interface';
import { StorageRepository } from './repository/storage.repository';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NEW_MESSAGE_EVENT_NAME,
  NewMessageEvent,
} from 'src/wsapp/event/new-message.event';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class RepeatersService {
  private timers: Record<string, any> = {};
  private groupMessages: Record<string, NewMessageEvent[]> = {};
  private logger = new Logger(RepeatersService.name);

  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly httpService: HttpService,
  ) {}

  async create(input: CreateRepeater) {
    const data = await this.storageRepository.add(input);
    return data;
  }

  async remove(id: string) {
    const data = await this.storageRepository.remove(id);
    return data;
  }

  async getList() {
    const data = await this.storageRepository.getList();
    return data;
  }

  private processQueue(
    number: string,
    link: string,
    event: NewMessageEvent,
    timeDelay: number,
  ) {
    const id = this.getId(number, link);
    const timer = this.timers[id];

    if (timer) {
      this.logger.log(`\t-> ${id}: Timer canceled.`);
      clearTimeout(timer);
    }

    this.groupMessages[id] ??= [];
    this.groupMessages[id].push(event);
    this.logger.log(`\t-> ${id}: Message added.`);

    this.timers[id] = setTimeout(() => {
      this.send(number, link, this.groupMessages[id]);
    }, timeDelay * 1000);
  }

  private getId(number: string, link: string) {
    return `${number}|${link}`;
  }

  private async send(
    number: string,
    link: string,
    payload: NewMessageEvent | NewMessageEvent[],
  ) {
    try {
      await this.httpService.axiosRef.post(link, payload);
    } catch (error) {}

    const id = this.getId(number, link);

    this.logger.log(`\t-> ${id}: Messages was send.`);

    delete this.timers[id];
    delete this.groupMessages[id];
  }

  @OnEvent(NEW_MESSAGE_EVENT_NAME)
  async getNewMessageEvent(payload: NewMessageEvent) {
    this.logger.log(
      `New message recieve ${payload.from} (${payload.author} - ${payload.type}): ${payload.body}`,
    );

    const number = payload.from;

    if (!number) {
      return;
    }

    const validate = await this.storageRepository.getValidate(number);

    validate.forEach((repeater) => {
      const link = repeater.data.receiverHttp;

      this.logger.log(`Repeater: [${link}], ${JSON.stringify(repeater.data)}`);

      if (repeater.data.timeDelay) {
        this.logger.log(
          `Message with repeater ${link} to ${number} has timeDelay ${repeater.data.timeDelay} s`,
        );

        this.processQueue(number, link, payload, repeater.data.timeDelay);
        return;
      }

      this.send(number, link, payload);
    });
  }
}
