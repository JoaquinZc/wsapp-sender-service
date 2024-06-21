import { SendMessageDto } from "../dto/send-message.dto";
import { MessageSender } from "../interface/message-sender.interface";
import { sendMessageToIdMessageSender } from "./send-message-to-id-message-sender.adaptor";

export function sendMessageToMessageSender(sendMessage: SendMessageDto): MessageSender {  
  return {
    id: sendMessageToIdMessageSender(sendMessage),
    destiny: sendMessage.destiny,
    message: sendMessage.message,
  }
}