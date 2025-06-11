export const NEW_MESSAGE_EVENT_NAME = 'event.message.new';

export interface NewMessageEvent {
  author?: string;
  from?: string;
  fromMe: boolean;
  to?: string;
  type: string;
  body: string;
}
