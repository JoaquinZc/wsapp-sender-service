import { Repeater } from '../interfaces/repeater.interface';

export class RepeaterEntity {
  constructor(public readonly data: Repeater) {}

  canRepeat(id: string): boolean {
    if (!this.data.excluding && !this.data.subscribed) {
      return true;
    }

    const isExclude = (this.data.excluding?.indexOf(id) ?? -1) !== -1;
    const isInclude = (this.data.subscribed?.indexOf(id) ?? 0) !== -1;

    return !isExclude && isInclude;
  }
}
