// @flow
import getClosestScrollable from './get-closest-scrollable';
import getAllScrollablesInAncestry from './get-all-scrollables-in-ancestry';

export type Env = {|
  closestScrollable: ?Element,
  /** All scroll containers from closest to outermost (for nested scroll support) */
  scrollablesAncestry: Element[],
  isFixedOnPage: boolean,
|};

// TODO: do this check at the same time as the closest scrollable
// in order to avoid double calling getComputedStyle
// Do this when we move to multiple scroll containers
const getIsFixed = (el: ?Element): boolean => {
  if (!el) {
    return false;
  }
  const style: CSSStyleDeclaration = window.getComputedStyle(el);
  if (style.position === 'fixed') {
    return true;
  }
  return getIsFixed(el.parentElement);
};

export default (start: Element): Env => {
  const closestScrollable: ?Element = getClosestScrollable(start);
  const scrollablesAncestry: Element[] = getAllScrollablesInAncestry(start);
  const isFixedOnPage: boolean = getIsFixed(start);

  return {
    closestScrollable,
    scrollablesAncestry,
    isFixedOnPage,
  };
};
