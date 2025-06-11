export enum WsappStatus {
  OFF,
  WAITNG,
  READY,
}

export interface Wsapp {
  status: WsappStatus;
  qrCode?: string;
}
