export interface Repeater {
  id: string;
  receiverHttp: string;
  subscribed?: string[];
  excluding?: string[];
  timeDelay?: number;
}
