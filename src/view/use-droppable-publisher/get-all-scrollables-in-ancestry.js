// @flow
import getClosestScrollable from './get-closest-scrollable';

/**
 * Returns all scroll containers in the ancestry of the given element,
 * from closest (innermost) to furthest (outermost).
 * Used for nested scroll container support.
 */
const getAllScrollablesInAncestry = (el: ?Element): Element[] => {
  const result: Element[] = [];
  let current: ?Element = el;

  while (current && current !== document.body) {
    const scrollable: ?Element = getClosestScrollable(current);
    if (!scrollable) {
      break;
    }
    result.push(scrollable);
    current = scrollable.parentElement;
  }
  return result;
};

export default getAllScrollablesInAncestry;
