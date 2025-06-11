import { SendMessageDto } from '../dto/send-message.dto';

export type MessageSenderId = string;

export interface MessageSender extends SendMessageDto {
  id: MessageSenderId;
}
