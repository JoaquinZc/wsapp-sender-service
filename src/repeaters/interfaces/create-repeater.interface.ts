import { Repeater } from './repeater.interface';

export interface CreateRepeater extends Omit<Repeater, 'id'> {}
