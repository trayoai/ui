import * as React from 'react';

export interface ColumnGeometry {
  offsetLeft: number;
  offsetWidth: number;
}

export interface HiddenCounts {
  leftCount: number;
  rightCount: number;
}

/**
 * Pure, DOM-free count of columns clipped by horizontal scroll. A column is
 * right-clipped when its right edge spills past the viewport's right edge, and
 * left-clipped when its left edge sits before the viewport's left edge (mirrors
 * `examples/Table 1 - Hidden-column counter.html`). Every clipped column counts,
 * including label-less ones (checkbox / actions), so the badge number matches
 * the literal number of off-screen columns. `epsilon` absorbs sub-pixel rounding.
 */
export function computeHiddenCounts(
  cols: ColumnGeometry[],
  scrollLeft: number,
  clientWidth: number,
  epsilon = 1,
): HiddenCounts {
  const viewportRight = scrollLeft + clientWidth;
  let leftCount = 0;
  let rightCount = 0;
  for (const c of cols) {
    if (c.offsetLeft + c.offsetWidth > viewportRight + epsilon) rightCount++;
    else if (c.offsetLeft < scrollLeft - epsilon) leftCount++;
  }
  return { leftCount, rightCount };
}

const ZERO: HiddenCounts = { leftCount: 0, rightCount: 0 };

/**
 * Tracks how many table columns are scrolled out of view on each side of a
 * horizontal scroll container, and exposes a click-to-scroll helper. Recomputes
 * on scroll, on container resize, and after first layout. Geometry is read from
 * `thead th` elements inside the container; the math lives in `computeHiddenCounts`.
 */
export function useHiddenColumns(scrollRef: React.RefObject<HTMLElement | null>) {
  const [counts, setCounts] = React.useState<HiddenCounts>(ZERO);
  // Height of the table's header row, used to vertically center the overflow
  // badge within the header band (not the full table height).
  const [headerHeight, setHeaderHeight] = React.useState(0);
  // Horizontal geometry as of the last measurement, so the scroll listener can
  // tell a real x-axis move from the vertical scrolling that shares this
  // element (see `onScroll`). Written by every recompute, not just scroll ones.
  const lastX = React.useRef({ scrollLeft: -1, clientWidth: -1 });

  const recompute = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    lastX.current = { scrollLeft: el.scrollLeft, clientWidth: el.clientWidth };
    const cols: ColumnGeometry[] = Array.from(
      el.querySelectorAll<HTMLTableCellElement>('thead th'),
    ).map((th) => ({
      offsetLeft: th.offsetLeft,
      offsetWidth: th.offsetWidth,
    }));
    const next = computeHiddenCounts(cols, el.scrollLeft, el.clientWidth);
    // Keep the previous object when nothing changed: a fresh literal is never
    // `Object.is`-equal, so it would re-render the whole scroll region on every
    // recompute (including every frame of vertical scroll).
    setCounts((prev) =>
      prev.leftCount === next.leftCount && prev.rightCount === next.rightCount
        ? prev
        : next,
    );
    setHeaderHeight(el.querySelector('thead')?.getBoundingClientRect().height ?? 0);
  }, [scrollRef]);

  // The `.htbl` surfaces scroll BOTH axes on this element (TRA-1428), and
  // vertical scroll cannot change which columns are clipped. Skip the per-cell
  // layout reads unless the horizontal geometry actually moved. Only the scroll
  // listener is gated: resize and child mutations change column geometry
  // without touching `scrollLeft`, so those still recompute unconditionally.
  const onScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (
      lastX.current.scrollLeft === el.scrollLeft &&
      lastX.current.clientWidth === el.clientWidth
    ) {
      return;
    }
    recompute();
  }, [recompute, scrollRef]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(recompute) : null;
    ro?.observe(el);
    // A consumer can mount a loader first and swap the <table> in later (the
    // Home tabs do). The container's own box is unchanged by that swap, so the
    // ResizeObserver never fires and the single mount-time rAF measured zero
    // columns — watch child mutations so the first real header row gets
    // measured. `subtree: false` on purpose: lazy-loaded rows append inside
    // <tbody> and cannot change column widths under `table-layout: fixed`.
    const mo =
      typeof MutationObserver !== 'undefined' ? new MutationObserver(recompute) : null;
    mo?.observe(el, { childList: true });
    const raf = requestAnimationFrame(recompute); // first layout pass
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      mo?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [scrollRef, recompute, onScroll]);

  const scrollBySide = React.useCallback(
    (side: 'left' | 'right') => {
      const el = scrollRef.current;
      if (!el) return;
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const delta = el.clientWidth * 0.8 * (side === 'right' ? 1 : -1);
      el.scrollBy({ left: delta, behavior: reduce ? 'auto' : 'smooth' });
    },
    [scrollRef],
  );

  return {
    leftCount: counts.leftCount,
    rightCount: counts.rightCount,
    headerHeight,
    scrollBySide,
  };
}
