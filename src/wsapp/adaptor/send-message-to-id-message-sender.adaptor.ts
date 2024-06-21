import md5 from "md5";
import { SendMessageDto } from "../dto/send-message.dto";
import { MessageSenderId } from "../interface/message-sender.interface";

export function sendMessageToIdMessageSender(dto: SendMessageDto): MessageSenderId {
  const pure = JSON.stringify({ destiny: dto.destiny, message: dto.message });
  return md5(pure);
}