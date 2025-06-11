import { RepeaterEntity } from '../entity/repeater.entity';
import { CreateRepeater } from '../interfaces/create-repeater.interface';
import { Repeater } from '../interfaces/repeater.interface';

export abstract class StorageRepository {
  abstract getList(): Promise<RepeaterEntity[]>;
  abstract getValidate(number: string): Promise<RepeaterEntity[]>;
  abstract add(input: CreateRepeater): Promise<RepeaterEntity>;
  abstract remove(id: Repeater['id']): Promise<boolean>;
}
