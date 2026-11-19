export interface GuideRect {
  left: number;
  top: number;
  width: number;
  height: number;
}
export function clipGuideRect(
  rect: GuideRect,
  width: number,
  height: number,
): GuideRect | null {
  const left = Math.max(4, rect.left - 5),
    top = Math.max(4, rect.top - 5);
  const right = Math.min(width - 4, rect.left + rect.width + 5),
    bottom = Math.min(height - 4, rect.top + rect.height + 5);
  return right > left && bottom > top
    ? { left, top, width: right - left, height: bottom - top }
    : null;
}
export function guideBubblePosition(
  rect: GuideRect | null,
  width: number,
  height: number,
  bubbleHeight: number,
) {
  const margin = 16,
    bubbleWidth = Math.max(0, Math.min(360, width - margin * 2));
  const left = rect
    ? Math.min(
        Math.max(margin, rect.left + rect.width / 2 - bubbleWidth / 2),
        width - bubbleWidth - margin,
      )
    : Math.max(margin, (width - bubbleWidth) / 2);
  const below = rect ? rect.top + rect.height + 16 : margin;
  const above = rect ? rect.top - bubbleHeight - 16 : margin;
  const top = rect
    ? below + bubbleHeight <= height - margin
      ? below
      : above >= margin
        ? above
        : Math.max(margin, height - bubbleHeight - margin)
    : Math.max(margin, (height - bubbleHeight) / 2);
  return {
    left,
    top,
    width: bubbleWidth,
    maxHeight: Math.max(0, height - margin * 2),
  };
}
