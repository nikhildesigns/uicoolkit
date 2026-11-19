"use client";

import type { ReactNode } from "react";
import type { SplitNumberPreset } from "./split-number-field-state";

// Icons on a 16-unit grid: a faint box with the edited edge or corner drawn strong.
const icon = (children: ReactNode) => (
  <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    {children}
  </svg>
);
const box = <rect x={2.75} y={2.75} width={10.5} height={10.5} rx={2} strokeOpacity={0.35} />;
const edges = { top: "M4 2.75h8", right: "M13.25 4v8", bottom: "M4 13.25h8", left: "M2.75 4v8" };
const side = (edge: keyof typeof edges) => icon([<g key="box">{box}</g>, <path key="edge" d={edges[edge]} />]);
// A corner arc, turned into place.
const corner = (turn: number) => icon([<g key="box">{box}</g>, <path key="arc" d="M2.75 8V5.75a3 3 0 0 1 3-3H8" transform={`rotate(${turn} 8 8)`} />]);

const icons = {
  horizontal: icon([<g key="box">{box}</g>, <path key="lines" d="M5.5 5.5v5M10.5 5.5v5" />]),
  vertical: icon([<g key="box">{box}</g>, <path key="lines" d="M5.5 5.5h5M5.5 10.5h5" />]),
  all: icon(<rect x={2.75} y={2.75} width={10.5} height={10.5} rx={3} />),
  allSides: icon(<rect x={2.75} y={2.75} width={10.5} height={10.5} rx={2} />),
  // Four corner brackets: open the value into its parts.
  split: icon(<path d="M2.75 6V4.75a2 2 0 0 1 2-2H6M10 2.75h1.25a2 2 0 0 1 2 2V6M13.25 10v1.25a2 2 0 0 1-2 2H10M6 13.25H4.75a2 2 0 0 1-2-2V10" />),
};

// Split sides keep the merged columns: left and right under horizontal, top and bottom under vertical.
const sides = [
  { key: "left", label: "left", icon: side("left") },
  { key: "top", label: "top", icon: side("top") },
  { key: "right", label: "right", icon: side("right") },
  { key: "bottom", label: "bottom", icon: side("bottom") },
];

/** Padding or margin: horizontal and vertical, then left and right beneath horizontal, top and bottom beneath vertical. */
export const sidesPreset: SplitNumberPreset = {
  toggleLabel: "Individual sides",
  toggleIcon: icons.split,
  levels: [
    [
      { key: "horizontal", label: "horizontal", icon: icons.horizontal, covers: ["left", "right"] },
      { key: "vertical", label: "vertical", icon: icons.vertical, covers: ["top", "bottom"] },
    ],
    sides,
  ],
};

/** Border width, or any value usually the same on every side: one value, then each side, left first. */
export const allSidesPreset: SplitNumberPreset = {
  toggleLabel: "Individual sides",
  toggleIcon: icons.split,
  levels: [[{ key: "all", label: "all sides", icon: icons.allSides, covers: ["left", "top", "right", "bottom"] }], sides],
};

/** Corner radius: one value, then each corner where it sits. */
export const cornersPreset: SplitNumberPreset = {
  toggleLabel: "Individual corners",
  toggleIcon: icons.split,
  levels: [
    [{ key: "all", label: "all corners", icon: icons.all, covers: ["topLeft", "topRight", "bottomLeft", "bottomRight"] }],
    [
      { key: "topLeft", label: "top left", icon: corner(0) },
      { key: "topRight", label: "top right", icon: corner(90) },
      { key: "bottomLeft", label: "bottom left", icon: corner(270) },
      { key: "bottomRight", label: "bottom right", icon: corner(180) },
    ],
  ],
};
