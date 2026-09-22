/** The path's gradient endpoints. Anchored to fixed grid coordinates (see the
 *  `gradientUnits="userSpaceOnUse"` + fixed x1/y1/x2/y2 in ZipGame.tsx) rather than the path's own
 *  bounding box, so a cell's color is fixed by its position on the grid and never shifts as the
 *  path grows, shrinks, or is undone. */
export const ZIP_GRADIENT_FROM = '#e879f9'
export const ZIP_GRADIENT_TO = '#e11d48'
/** Flat fallback used for small non-path UI accents (diagram connector, etc). */
export const ZIP_PATH_COLOR = '#c026d3'
