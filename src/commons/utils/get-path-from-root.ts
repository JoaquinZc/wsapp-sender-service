import * as path from 'path';

export const getPathFromRoot = (...params: string[]) => {
  return path.join(__dirname, '../../../', ...params);
};
