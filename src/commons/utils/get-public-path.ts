import { getPathFromRoot } from './get-path-from-root';

export const getPublicPath = (...routes: string[]) => {
  return getPathFromRoot('/public', ...routes);
};
