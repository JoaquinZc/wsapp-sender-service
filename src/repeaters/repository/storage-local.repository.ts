import { Injectable } from '@nestjs/common';
import { StorageRepository } from './storage.repository';
import { RepeaterEntity } from '../entity/repeater.entity';
import { getPathFromRoot } from 'src/commons/utils/get-path-from-root';
import { writeFile as writeFileFs, readFile as readFileFs } from 'fs/promises';
import { Repeater } from '../interfaces/repeater.interface';
import { CreateRepeater } from '../interfaces/create-repeater.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageLocalRepository extends StorageRepository {
  private repeaters: RepeaterEntity[] | null;
  private pathDB = getPathFromRoot('./data/repeaters.json');

  private async readFile(): Promise<RepeaterEntity[]> {
    if (!this.repeaters) {
      return this.repeaters;
    }

    try {
      const contentString = await readFileFs(this.pathDB, 'utf8');

      const content = JSON.parse(contentString || '[]') as Repeater[];

      this.repeaters = content.map((item) => new RepeaterEntity(item));
    } catch {}
  }

  private async writeFile(): Promise<void> {
    await writeFileFs(
      this.pathDB,
      JSON.stringify(
        this.repeaters.map((item) => item.data),
        null,
        2,
      ),
      'utf8',
    );
  }

  async add(input: CreateRepeater): Promise<RepeaterEntity> {
    await this.readFile();

    const newRepeater = new RepeaterEntity({
      ...input,
      id: randomUUID(),
    });

    this.repeaters = !this.repeaters
      ? [newRepeater]
      : [...this.repeaters, newRepeater];

    await this.writeFile();

    return newRepeater;
  }

  async getList(): Promise<RepeaterEntity[]> {
    await this.readFile();

    return this.repeaters;
  }

  async getValidate(number: string): Promise<RepeaterEntity[]> {
    await this.readFile();

    const filterRepeaters = (this.repeaters ?? []).filter((repeater) =>
      repeater.canRepeat(number),
    );

    return filterRepeaters;
  }

  async remove(id: Repeater['id']): Promise<boolean> {
    await this.readFile();

    if (!this.repeaters) {
      return false;
    }

    const oldLength = this.repeaters.length;

    this.repeaters = this.repeaters.filter(
      (repeater) => repeater.data.id !== id,
    );

    await this.writeFile();

    return oldLength !== this.repeaters.length;
  }
}
