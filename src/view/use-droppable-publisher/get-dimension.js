// @flow
import {
  getBox,
  withScroll,
  createBox,
  expand,
  type BoxModel,
  type Position,
  type Spacing,
} from 'css-box-model';
import getDroppableDimension, {
  type Closest,
} from '../../state/droppable/get-droppable';
import type { Env } from './get-env';
import type {
  DroppableDimension,
  DroppableDescriptor,
  Direction,
  ScrollSize,
} from '../../types';
import getScroll from './get-scroll';
import getCombinedScroll from './get-combined-scroll';

const getClient = (
  targetRef: HTMLElement,
  closestScrollable: ?Element,
): BoxModel => {
  const base: BoxModel = getBox(targetRef);

  // Droppable has no scroll parent
  if (!closestScrollable) {
    return base;
  }

  // Droppable is not the same as the closest scrollable
  // (Droppable is INSIDE a scroll container - e.g. ref on inner div, scroll on parent)
  // Use scroll container's full content dimensions so subject covers entire scrollable area.
  // Otherwise getBox(ref) returns only the visible viewport and drop zone breaks when scrolled.
  if (targetRef !== closestScrollable) {
    const scrollBox: BoxModel = getBox(closestScrollable);
    const scroll = { x: closestScrollable.scrollLeft, y: closestScrollable.scrollTop };
    const top: number = scrollBox.paddingBox.top - scroll.y;
    const left: number = scrollBox.paddingBox.left - scroll.x;
    const paddingBox: Spacing = {
      top,
      left,
      bottom: top + closestScrollable.scrollHeight,
      right: left + closestScrollable.scrollWidth,
    };
    const borderBox: Spacing = expand(paddingBox, scrollBox.border);

    return createBox({  
      borderBox,
      margin: scrollBox.margin,
      border: scrollBox.border,
      padding: scrollBox.padding,
    });
  }

  // Droppable is scrollable

  // Element.getBoundingClient() returns a clipped padding box:
  // When not scrollable: the full size of the element
  // When scrollable: the visible size of the element
  // (which is not the full width of its scrollable content)
  // So we recalculate the borderBox of a scrollable droppable to give
  // it its full dimensions. This will be cut to the correct size by the frame

  // Creating the paddingBox based on scrollWidth / scrollTop
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
  const top: number = base.paddingBox.top - closestScrollable.scrollTop;
  const left: number = base.paddingBox.left - closestScrollable.scrollLeft;
  const bottom: number = top + closestScrollable.scrollHeight;
  const right: number = left + closestScrollable.scrollWidth;

  // unclipped padding box
  const paddingBox: Spacing = {
    top,
    right,
    bottom,
    left,
  };

  // Creating the borderBox by adding the borders to the paddingBox
  const borderBox: Spacing = expand(paddingBox, base.border);

  // We are not accounting for scrollbars
  // Adjusting for scrollbars is hard because:
  // - they are different between browsers
  // - scrollbars can be activated and removed during a drag
  // We instead account for this slightly in our auto scroller

  const client: BoxModel = createBox({
    borderBox,
    margin: base.margin,
    border: base.border,
    padding: base.padding,
  });
  return client;
};

type Args = {|
  ref: HTMLElement,
  descriptor: DroppableDescriptor,
  env: Env,
  windowScroll: Position,
  direction: Direction,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  shouldClipSubject: boolean,
|};

export default ({
  ref,
  descriptor,
  env,
  windowScroll,
  direction,
  isDropDisabled,
  isCombineEnabled,
  shouldClipSubject,
}: Args): DroppableDimension => {
  const closestScrollable: ?Element = env.closestScrollable;
  const client: BoxModel = getClient(ref, closestScrollable);
  const page: BoxModel = withScroll(client, windowScroll);
  const closest: ?Closest = (() => {
    if (!closestScrollable) {
      return null;
    }

    const frameClient: BoxModel = getBox(closestScrollable);
    const scrollSize: ScrollSize = {
      scrollHeight: closestScrollable.scrollHeight,
      scrollWidth: closestScrollable.scrollWidth,
    };

    // Use combined scroll for nested scroll containers support
    const scroll = env.scrollablesAncestry.length > 0
      ? getCombinedScroll(env.scrollablesAncestry)
      : getScroll(closestScrollable);

    return {
      client: frameClient,
      page: withScroll(frameClient, windowScroll),
      scroll,
      scrollSize,
      shouldClipSubject,
    };
  })();

  const dimension: DroppableDimension = getDroppableDimension({
    descriptor,
    isEnabled: !isDropDisabled,
    isCombineEnabled,
    isFixedOnPage: env.isFixedOnPage,
    direction,
    client,
    page,
    closest,
  });

  return dimension;
};
