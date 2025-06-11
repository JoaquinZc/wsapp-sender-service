import { Injectable } from '@nestjs/common';
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

  @OnEvent(NEW_MESSAGE_EVENT_NAME)
  async getNewMessageEvent(payload: NewMessageEvent) {
    console.log('NEW MESSAGE FROM RepeatersService: ', payload);

    const number = payload.from;

    if (!number) {
      return;
    }

    const validate = await this.storageRepository.getValidate(number);

    validate.forEach((repeater) => {
      const link = repeater.data.receiverHttp;

      this.httpService.post(link, payload);
    });
  }
}
