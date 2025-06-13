export const NEW_MESSAGE_EVENT_NAME = 'event.message.new';

export interface NewMessageEvent {
  messageId: string; // ID único del mensaje
  body: string; // Cuerpo del mensaje
  type: string; // Tipo de mensaje (text, image, etc.)
  fromMe: boolean; // Si fue enviado por el usuario/bot actual
  senderId: string; // ID de quien envió el mensaje (individual, aún en grupo)
  author?: string; // Solo en grupos: ID del autor (quien lo envió)
  chatId: string; // ID del chat (grupo o individual)
  isGroup: boolean; // True si el mensaje se recibió en un grupo
  groupId?: string; // ID del grupo si aplica
  timestamp: number; // Timestamp UNIX del mensaje
  hasMedia: boolean; // Si el mensaje incluye archivos multimedia
  isForwarded: boolean; // Si el mensaje fue reenviado
  isEphemeral: boolean; // Si el mensaje es efímero (desaparece)
  mentionedIds?: string[]; // Lista de IDs mencionados en el mensaje
  groupMentions?: any[]; // Menciones internas del grupo (opcional)
  links?: { link: string }[]; // Enlaces encontrados en el mensaje
}
