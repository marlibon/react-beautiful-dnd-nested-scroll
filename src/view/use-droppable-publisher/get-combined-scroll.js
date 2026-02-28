// @flow
import type { Position } from 'css-box-model';
import getScroll from './get-scroll';

/**
 * Returns the combined scroll position of all scroll containers in the ancestry.
 * Used for nested scroll container support - when any container scrolls,
 * the total displacement is the sum of all scroll positions.
 */
export default (scrollables: Element[]): Position => {
  if (scrollables.length === 0) {
    return { x: 0, y: 0 };
  }

  return scrollables.reduce(
    (acc: Position, el: Element) => {
      const scroll: Position = getScroll(el);
      return {
        x: acc.x + scroll.x,
        y: acc.y + scroll.y,
      };
    },
    { x: 0, y: 0 },
  );
};
