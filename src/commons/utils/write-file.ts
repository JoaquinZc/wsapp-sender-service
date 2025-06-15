import { mkdir, writeFile as writeFileFs } from 'fs/promises';
import { dirname } from 'path';

export const writeFile = async (
  path: string,
  data: string,
  encode: BufferEncoding,
) => {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  return await writeFileFs(path, data, encode);
};
