"use client";

import type { ReactNode } from "react";

// 16-unit icons drawn in the current text colour, sized by the control that holds them.
const icon = (children: ReactNode) => (
  <svg viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const lines = (widths: [number, number][]) => icon(<path d={widths.map(([start, end], row) => `M${start} ${4 + row * 4}H${end}`).join("")} />);

/**
 * Icons for the built-in segments, toggle buttons and short labels: layout direction and wrap, text
 * alignment, angle and gap, and flips. Pass them as an option's or button's icon, or use your own.
 */
export const inspectorFieldIcons = {
  /** Children stack top to bottom. */
  vertical: icon(<path d="M8 2.75v10.5M4.25 9.5 8 13.25l3.75-3.75" />),
  /** Children run left to right. */
  horizontal: icon(<path d="M2.75 8h10.5M9.5 4.25 13.25 8 9.5 11.75" />),
  /** Children wrap onto new lines. */
  wrap: icon(<path d="M2.75 4.5h7.5a3 3 0 0 1 0 6H5.5M7.5 8.5l-2 2 2 2" />),
  alignLeft: lines([
    [2.75, 13.25],
    [2.75, 9.5],
    [2.75, 11.5],
  ]),
  alignCenter: lines([
    [2.75, 13.25],
    [5, 11],
    [4, 12],
  ]),
  alignRight: lines([
    [2.75, 13.25],
    [6.5, 13.25],
    [4.5, 13.25],
  ]),
  justify: lines([
    [2.75, 13.25],
    [2.75, 13.25],
    [2.75, 13.25],
  ]),
  /** An angle, such as Rotation's short label. */
  angle: icon(<path d="M12.75 12.5H3.25L10.5 3.5M7.25 7.75a5 5 0 0 1 1.5 4.75" />),
  /** The space between children, such as Gap's short label. */
  gap: icon(<path d="M2.75 3v10M13.25 3v10M4.75 8h6.5M6.5 6.25 4.75 8l1.75 1.75M9.5 6.25 11.25 8 9.5 9.75" />),
  /** Turn a quarter turn clockwise. */
  rotate: icon(<path d="M3.5 6.5a5 5 0 0 1 8.6-2.1M12.5 2.5v2.25h-2.25M6.5 8.5h5v5h-5z" />),
  /** Keep width and height in proportion. */
  link: icon(<path d="M6.75 9.25 9.25 6.75M7 4.5l1-1a2.47 2.47 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1a2.47 2.47 0 0 1-3.5-3.5l1-1" />),
  /** Mirror left to right. */
  flipHorizontal: icon(<path d="M8 2.5v11M6 4.5 2.75 11.5H6zM10 4.5l3.25 7H10z" />),
  /** Mirror top to bottom. */
  flipVertical: icon(<path d="M2.5 8h11M4.5 6l7-3.25V6zM4.5 10l7 3.25V10z" />),
  /** How see-through a layer is, such as Opacity's short label. */
  opacity: icon(<path d="M8 2.75a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5ZM8 2.75v10.5M8 5.5h4.25M8 8h5.25M8 10.5h4.25" />),
  /** A border drawn inside the layer's edge. */
  borderInside: icon(<path d="M5.5 2.75v10.5M5.5 2.75h7.75M5.5 13.25h7.75M8 5.5v5" />),
  /** A border centred on the layer's edge. */
  borderCenter: icon(<path d="M8 2.75v10.5M8 2.75h5.25M8 13.25h5.25M5.5 5.5v5M10.5 5.5v5" />),
  /** A border drawn outside the layer's edge. */
  borderOutside: icon(<path d="M10.5 2.75v10.5M10.5 2.75h2.75M10.5 13.25h2.75M8 5.5v5" />),
  /** A solid line. */
  solid: icon(<path d="M2.75 8h10.5" />),
  /** A dashed line. */
  dashed: icon(<path d="M2.75 8h2.5M6.75 8h2.5M10.75 8h2.5" />),
  /** Text sits at the top of its box. */
  alignTop: icon(<path d="M2.75 2.75h10.5M8 13.25V5.5M5.5 8 8 5.5 10.5 8" />),
  /** Text sits in the middle of its box. */
  alignMiddle: icon(<path d="M2.75 8h10.5M8 2.75v2.5M8 10.75v2.5M6.25 3.5 8 5.25 9.75 3.5M6.25 12.5 8 10.75l1.75 1.75" />),
  /** Text sits at the bottom of its box. */
  alignBottom: icon(<path d="M2.75 13.25h10.5M8 2.75v7.75M5.5 8 8 10.5 10.5 8" />),
  /** Font size, such as Size's short label: a large and a small T. */
  fontSize: icon(<path d="M2.75 4h6.5M6 4v9M9.75 8h3.5M11.5 8v5" />),
  /** The height of a line of text. */
  lineHeight: icon(<path d="M2.75 2.75h10.5M2.75 13.25h10.5M5.5 11 8 5l2.5 6M6.4 9h3.2" />),
  /** The space between letters. */
  letterSpacing: icon(<path d="M2.75 3v10M13.25 3v10M5.5 11 8 5l2.5 6M6.4 9h3.2" />),
  /** More settings, such as a shadow's offset and blur. */
  settings: icon(<path d="M2.75 5h10.5M2.75 11h10.5M6 3.25v3.5M10 9.25v3.5" />),
};
