// Pure pixel operations on raw RGBA buffers ({ width, height, data: Uint8Array }).
// No sharp/phaser imports here so the functions stay unit-testable.

const A_T = 16; // alpha threshold for "occupied"

export function makeImage(width, height) {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

export function cloneImage(img) {
  return { width: img.width, height: img.height, data: new Uint8Array(img.data) };
}

export function crop(img, x0, y0, w, h) {
  const out = makeImage(w, h);
  for (let y = 0; y < h; y++) {
    const sy = y0 + y;
    if (sy < 0 || sy >= img.height) continue;
    for (let x = 0; x < w; x++) {
      const sx = x0 + x;
      if (sx < 0 || sx >= img.width) continue;
      const si = (sy * img.width + sx) * 4;
      const di = (y * w + x) * 4;
      out.data[di] = img.data[si];
      out.data[di + 1] = img.data[si + 1];
      out.data[di + 2] = img.data[si + 2];
      out.data[di + 3] = img.data[si + 3];
    }
  }
  return out;
}

export function blit(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) {
    const ty = dy + y;
    if (ty < 0 || ty >= dst.height) continue;
    for (let x = 0; x < src.width; x++) {
      const tx = dx + x;
      if (tx < 0 || tx >= dst.width) continue;
      const si = (y * src.width + x) * 4;
      const di = (ty * dst.width + tx) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
}

export function bbox(img, threshold = A_T) {
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  const { width, height, data } = img;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export function occupancy(img, axis, threshold = A_T) {
  const { width, height, data } = img;
  const n = axis === 'row' ? height : width;
  const m = axis === 'row' ? width : height;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let c = 0;
    for (let j = 0; j < m; j++) {
      const x = axis === 'row' ? j : i;
      const y = axis === 'row' ? i : j;
      if (data[(y * width + x) * 4 + 3] > threshold) c++;
    }
    out[i] = c / m;
  }
  return out;
}

// Known-count grid detection. Picks n-1 cut positions minimising occupancy under a spacing prior
// (dynamic programming), so unevenly spaced rows and FX that cross the gaps are both handled.
export function detectCuts(occ, n, { gapLevel = 0.012, minSpacing = 0.55, maxSpacing = 1.7 } = {}) {
  const size = occ.length;
  let first = 0, last = size - 1;
  while (first < size && occ[first] < gapLevel) first++;
  while (last > first && occ[last] < gapLevel) last--;
  const extent = last - first + 1;
  const pitch = extent / n;
  if (n === 1) return { bounds: [first, last + 1], maxCutOcc: 0, mode: 'single', pitch };
  // smoothed occupancy
  const sm = new Float32Array(size);
  for (let i = 0; i < size; i++) sm[i] = (occ[Math.max(0, i - 1)] + occ[i] + occ[Math.min(size - 1, i + 1)]) / 3;
  const lo = Math.floor(pitch * minSpacing), hi = Math.ceil(pitch * maxSpacing);
  const spacingCost = (gap) => 0.06 * Math.abs(gap - pitch) / pitch;
  const INF = 1e9;
  let prev = new Float32Array(size).fill(INF);
  let back = [];
  // k = 1: first cut relative to the virtual start at first-1
  for (let i = first + 1; i < last; i++) {
    const gap = i - (first - 1);
    if (gap < lo || gap > hi) continue;
    prev[i] = sm[i] + spacingCost(gap);
  }
  for (let k = 2; k <= n - 1; k++) {
    const cur = new Float32Array(size).fill(INF);
    const bk = new Int32Array(size).fill(-1);
    for (let i = first + 1; i < last; i++) {
      let best = INF, bj = -1;
      for (let j = i - hi; j <= i - lo; j++) {
        if (j <= first || prev[j] >= INF) continue;
        const v = prev[j] + sm[i] + spacingCost(i - j);
        if (v < best) { best = v; bj = j; }
      }
      cur[i] = best; bk[i] = bj;
    }
    back.push(bk); prev = cur;
  }
  // close with the virtual end at last+1
  let bestEnd = -1, bestV = INF;
  for (let i = first + 1; i < last; i++) {
    if (prev[i] >= INF) continue;
    const gap = (last + 1) - i;
    if (gap < lo || gap > hi) continue;
    const v = prev[i] + spacingCost(gap);
    if (v < bestV) { bestV = v; bestEnd = i; }
  }
  let cuts = [];
  if (bestEnd < 0) {
    for (let k = 1; k < n; k++) cuts.push(Math.round(first + k * pitch));
  } else {
    let i = bestEnd;
    cuts.push(i);
    for (let k = back.length - 1; k >= 0; k--) { i = back[k][i]; cuts.push(i); }
    cuts.reverse();
  }
  const bounds = [first, ...cuts, last + 1];
  const maxCutOcc = Math.max(0, ...cuts.map((c) => occ[c]));
  return { bounds, maxCutOcc, mode: bestEnd < 0 ? 'pitch' : 'dp', pitch };
}

export function detectCells(img, rows, cols, opts = {}) {
  const rowOcc = occupancy(img, 'row');
  const colOcc = occupancy(img, 'col');
  const r = detectCuts(rowOcc, rows, opts);
  const c = detectCuts(colOcc, cols, opts);
  const cells = [];
  for (let i = 0; i < rows; i++) {
    const rowCells = [];
    for (let j = 0; j < cols; j++) {
      rowCells.push({ x: c.bounds[j], y: r.bounds[i], w: c.bounds[j + 1] - c.bounds[j], h: r.bounds[i + 1] - r.bounds[i] });
    }
    cells.push(rowCells);
  }
  return { cells, rowBounds: r.bounds, colBounds: c.bounds, maxCutOcc: Math.max(r.maxCutOcc, c.maxCutOcc), modes: [r.mode, c.mode] };
}

// Connected components (8-connected) over a boolean mask. Returns label array and component stats.
export function components(width, height, maskFn) {
  const labels = new Int32Array(width * height).fill(-1);
  const comps = [];
  const stack = new Int32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (labels[idx] !== -1 || !maskFn(idx)) continue;
      const id = comps.length;
      const comp = { id, size: 0, x0: x, y0: y, x1: x, y1: y, sx: 0, sy: 0, touchesBorder: false };
      let sp = 0;
      stack[sp++] = idx;
      labels[idx] = id;
      while (sp > 0) {
        const cur = stack[--sp];
        const cx = cur % width, cy = (cur / width) | 0;
        comp.size++;
        comp.sx += cx; comp.sy += cy;
        if (cx < comp.x0) comp.x0 = cx; if (cx > comp.x1) comp.x1 = cx;
        if (cy < comp.y0) comp.y0 = cy; if (cy > comp.y1) comp.y1 = cy;
        if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) comp.touchesBorder = true;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = cy + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            if (nx < 0 || nx >= width) continue;
            const ni = ny * width + nx;
            if (labels[ni] === -1 && maskFn(ni)) { labels[ni] = id; stack[sp++] = ni; }
          }
        }
      }
      comps.push(comp);
    }
  }
  return { labels, comps };
}

// Keep the cell's main figure: drop components that touch the cell border and are small relative to the main one,
// and drop specks.
export function isolateMain(cell, { borderRatio = 0.4, speck = 12 } = {}) {
  const { width, height, data } = cell;
  const { labels, comps } = components(width, height, (i) => data[i * 4 + 3] > A_T);
  if (comps.length === 0) return { img: cell, main: null };
  let main = comps[0];
  for (const c of comps) if (c.size > main.size) main = c;
  const keep = new Uint8Array(comps.length);
  for (const c of comps) {
    if (c === main) { keep[c.id] = 1; continue; }
    if (c.size < speck) continue;
    if (c.touchesBorder && c.size < main.size * borderRatio) continue;
    keep[c.id] = 1;
  }
  const out = cloneImage(cell);
  for (let i = 0; i < width * height; i++) {
    const l = labels[i];
    if (l === -1 || !keep[l]) { out.data[i * 4 + 3] = 0; }
  }
  return { img: out, main, labels, comps };
}

// ---------- fixed-grid slicing ----------
// Cuts a sheet on fixed, evenly spaced cell bounds (no detection).
//
// Cell boundaries in generated art are nominal: slashes, trails and muzzle flashes routinely spill
// into the neighbouring frame. Cutting on the boundary slices effects in half and leaves the severed
// tail sitting in the next frame. So the sheet is segmented **once, globally**: every connected blob
// of pixels is assigned whole to the cell its centroid falls in. Each frame is then read from a padded
// window around its cell showing only its own blobs — an overflowing effect stays intact with the
// frame that owns it, and no fragment of a neighbour leaks in.
//
// Returns rows of { cell, main, labels, clipped } where `clipped` lists the sides ('left'/'right')
// on which the frame's art ends in a hard straight edge — an effect the generator itself cut off.
const CELL_PAD = 0.35;

export function sliceFixed(img, rows, cols, take = cols) {
  const xs = Array.from({ length: cols + 1 }, (_, i) => Math.round((img.width * i) / cols));
  const ys = Array.from({ length: rows + 1 }, (_, i) => Math.round((img.height * i) / rows));
  const { labels, comps } = components(img.width, img.height, (i) => img.data[i * 4 + 3] > A_T);
  const cellOf = (v, bounds) => { let k = bounds.length - 2; while (k > 0 && v < bounds[k]) k--; return k; };
  // Pass 1: the figure of each cell is the largest blob whose centroid lies in it.
  const mains = new Array(rows * cols).fill(null);
  const home = new Int32Array(comps.length).fill(-1);
  for (const c of comps) {
    if (c.size < 12) continue;
    const k = cellOf(c.sy / c.size, ys) * cols + cellOf(c.sx / c.size, xs);
    home[c.id] = k;
    if (!mains[k] || c.size > mains[k].size) mains[k] = c;
  }
  // Pass 2: every other blob goes with the figure it is nearest to, its own cell's or a neighbour's.
  // A slash tip that broke off and drifted across the line still sits right next to the figure that
  // swung it, and far from the one in the cell it landed in.
  const bboxGap = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
  const owner = new Int32Array(comps.length).fill(-1);
  for (const c of comps) {
    const k = home[c.id];
    if (k === -1) continue;
    if (mains[k] === c) { owner[c.id] = k; continue; }
    const r = (k / cols) | 0, col = k % cols;
    // A blob pressed against a cell line, with the neighbour's figure pressed against the same line
    // from the other side, is the severed half of that figure (a foot or glove the generator drew
    // across the boundary): it goes back to the neighbour regardless of what else is nearby.
    const T = 3;
    const left = col > 0 ? mains[k - 1] : null, right = col < cols - 1 ? mains[k + 1] : null;
    if (left && c.x0 - xs[col] <= T && xs[col] - 1 - left.x1 <= T) { owner[c.id] = k - 1; continue; }
    if (right && xs[col + 1] - 1 - c.x1 <= T && right.x0 - xs[col + 1] <= T) { owner[c.id] = k + 1; continue; }
    let best = k, bestGap = Infinity;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = col + dc;
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
      const m = mains[rr * cols + cc];
      if (!m) continue;
      const g = bboxGap(c, m);
      if (g < bestGap) { bestGap = g; best = rr * cols + cc; }
    }
    owner[c.id] = best;
  }

  const out = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < take; c++) {
      const cw = xs[c + 1] - xs[c], ch = ys[r + 1] - ys[r];
      const px = Math.round(cw * CELL_PAD), py = Math.round(ch * CELL_PAD);
      const x0 = Math.max(0, xs[c] - px), y0 = Math.max(0, ys[r] - py);
      const x1 = Math.min(img.width, xs[c + 1] + px), y1 = Math.min(img.height, ys[r + 1] + py);
      const cell = crop(img, x0, y0, x1 - x0, y1 - y0);
      const want = r * cols + c;
      for (let y = 0; y < cell.height; y++) for (let x = 0; x < cell.width; x++) {
        const g = labels[(y0 + y) * img.width + (x0 + x)];
        if (g === -1 || owner[g] !== want) cell.data[(y * cell.width + x) * 4 + 3] = 0;
      }
      // re-label within the cell so head detection and anchoring work in local coordinates
      let local = components(cell.width, cell.height, (i) => cell.data[i * 4 + 3] > A_T);
      let main = local.comps.length ? local.comps.reduce((a, m) => (m.size > a.size ? m : a)) : null;
      // Detached pieces are assigned by their own centroid, so a fragment of the neighbouring frame's
      // slash — or a stray the generator drew next to the figure — can land in this cell. Two tells:
      // anything small and far from this frame's figure, and anything sitting *behind* it. Characters
      // face right and their effects go right or wrap around them, so a detached blob entirely to the
      // left of the figure is a spill from the frame before, never part of this action.
      if (main) {
        const gap = (m) => Math.hypot(Math.max(0, m.x0 - main.x1, main.x0 - m.x1), Math.max(0, m.y0 - main.y1, main.y0 - m.y1));
        let dropped = false;
        for (const m of local.comps) {
          if (m === main) continue;
          const g = gap(m);
          const mainCx = main.sx / main.size;
          const mCx = m.sx / m.size, mainW = main.x1 - main.x0 + 1;
          const behind = (m.x1 < main.x0 && g > cw * 0.02) || (mCx < mainCx - mainW * 0.3 && m.size < main.size * 0.15);
          const speck = g > 0 && m.size < main.size * 0.05; // a detached crumb: debris, not an effect
          if (!behind && !speck && (m.size >= main.size * 0.25 || g <= cw * 0.1)) continue;
          for (let i = 0; i < cell.width * cell.height; i++) if (local.labels[i] === m.id) cell.data[i * 4 + 3] = 0;
          dropped = true;
        }
        if (dropped) {
          local = components(cell.width, cell.height, (i) => cell.data[i * 4 + 3] > A_T);
          main = local.comps.length ? local.comps.reduce((a, m) => (m.size > a.size ? m : a)) : null;
        }
      }
      // only edges near the cell line count as clipped — a hard edge mid-cell is a prop, not a cut
      const near = Math.round(cw * 0.2), lineL = xs[c] - x0, lineR = xs[c + 1] - x0;
      const clipped = local.comps.filter((m) => m.size >= 200).flatMap((m) => hardEdges(m, local.labels, cell.width, cw * 0.13)
        .filter((side) => (side === 'left' ? m.x0 - lineL <= near : lineR - m.x1 <= near)));
      // the figure itself running into the cell line is the clearest cut of all
      if (main && main.x0 - lineL <= 3) clipped.push('left');
      if (main && lineR - 1 - main.x1 <= 3) clipped.push('right');
      row.push({ cell, main, labels: local.labels, comps: local.comps, clipped: [...new Set(clipped)] });
    }
    out.push(row);
  }
  return out;
}

// A blob whose extreme left/right column is densely filled ends in a straight line through the
// interior of a figure or effect — the signature of art clipped at a cell edge. A natural silhouette's
// outermost column (a head, a heel, a fist, the tapered tip of a beam) holds only a few pixels.
// Two tests, either is enough: one long unbroken run, or many pixels in total (a two-toned beam cut
// flat gives several shorter runs).
function hardEdges(m, labels, width, minRun) {
  const h = m.y1 - m.y0 + 1;
  if (h < 40) return [];
  const column = (x) => {
    let best = 0, run = 0, total = 0;
    for (let y = m.y0; y <= m.y1; y++) {
      if (labels[y * width + x] === m.id) { total++; run++; if (run > best) best = run; } else run = 0;
    }
    return { best, total };
  };
  const cut = ({ best, total }) => best >= Math.max(minRun, 0.35 * h) || total >= Math.max(minRun * 0.8, 0.22 * h);
  const out = [];
  if (cut(column(m.x0))) out.push('left');
  if (cut(column(m.x1))) out.push('right');
  return out;
}

// Keys out a flat matte background (a model that cannot output alpha is asked for pure magenta).
// Only fires when all four corners agree on one saturated colour, so real art is never touched.
export function keyOutFlat(img, { tolerance = 60 } = {}) {
  const { width, height, data } = img;
  const px = (x, y) => { const i = (y * width + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  const corners = [px(1, 1), px(width - 2, 1), px(1, height - 2), px(width - 2, height - 2)];
  const [r, g, b] = corners[0];
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (sat < 120) return null;
  for (const c of corners) if (Math.abs(c[0] - r) + Math.abs(c[1] - g) + Math.abs(c[2] - b) > 30) return null;
  const out = cloneImage(img);
  let keyed = 0;
  for (let i = 0; i < width * height; i++) {
    const d = Math.abs(data[i * 4] - r) + Math.abs(data[i * 4 + 1] - g) + Math.abs(data[i * 4 + 2] - b);
    if (d <= tolerance) { out.data[i * 4 + 3] = 0; keyed++; }
  }
  return { img: out, key: [r, g, b], keyed: keyed / (width * height) };
}

// Removes a painted white/gray checkerboard background (baked transparency preview).
export function unbakeChecker(img) {
  const { width, height, data } = img;
  const n = width * height;
  const cand = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 16 && (r + g + b) / 3 > 196) cand[i] = 1;
  }
  const { labels, comps } = components(width, height, (i) => cand[i] === 1);
  const remove = new Uint8Array(comps.length);
  for (const c of comps) {
    if (c.touchesBorder) { remove[c.id] = 1; continue; }
    if (c.size < 30) continue;
    // bimodal test: checker has both light (~251) and dark (~227) squares
    let light = 0, dark = 0;
    for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) {
      const i = y * width + x;
      if (labels[i] !== c.id) continue;
      const m = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
      if (m > 242) light++; else if (m < 236) dark++;
    }
    const f1 = light / c.size, f2 = dark / c.size;
    if (f1 > 0.2 && f2 > 0.2) remove[c.id] = 1;
  }
  const out = cloneImage(img);
  for (let i = 0; i < n; i++) {
    const l = labels[i];
    if (l !== -1 && remove[l]) out.data[i * 4 + 3] = 0;
  }
  // erode 1px of the remaining figure boundary (kills the light fringe) then soften
  const alpha = new Uint8Array(n);
  for (let i = 0; i < n; i++) alpha[i] = out.data[i * 4 + 3];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (alpha[i] === 0) continue;
    let nearHole = false;
    for (let dy = -1; dy <= 1 && !nearHole; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (alpha[ny * width + nx] === 0) { nearHole = true; break; }
    }
    if (nearHole) {
      const m = (out.data[i * 4] + out.data[i * 4 + 1] + out.data[i * 4 + 2]) / 3;
      out.data[i * 4 + 3] = m > 200 ? 0 : 140;
    }
  }
  return out;
}

export function opaqueRatio(img, threshold = A_T) {
  let c = 0;
  const n = img.width * img.height;
  for (let i = 0; i < n; i++) if (img.data[i * 4 + 3] > threshold) c++;
  return c / n;
}

export function alphaValues(img) {
  const set = new Set();
  const n = img.width * img.height;
  for (let i = 0; i < n; i++) { set.add(img.data[i * 4 + 3]); if (set.size > 3) break; }
  return set.size;
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, mx === 0 ? 0 : d / mx, mx];
}

function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function isFringeHue(h, s) {
  if (s < 0.45) return false;
  return h >= 335 || h <= 12 || (h >= 280 && h <= 330);
}

// Replaces red/magenta matte halos at the silhouette boundary with the color of an inward pixel.
export function defringe(img, passes = 2) {
  let cur = cloneImage(img);
  const { width, height } = img;
  for (let p = 0; p < passes; p++) {
    const src = cur.data;
    const out = cloneImage(cur);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const a = src[i * 4 + 3];
      if (a === 0) continue;
      // boundary = has a transparent 4-neighbour or is semi-transparent
      let bx = 0, by = 0, boundary = a < 250;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of nb) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (src[(ny * width + nx) * 4 + 3] < A_T) { boundary = true; bx -= dx; by -= dy; }
      }
      if (!boundary) continue;
      const [h, s] = rgbToHsv(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]);
      if (!isFringeHue(h, s)) continue;
      // inward sample
      const ix = Math.max(0, Math.min(width - 1, x + (bx === 0 ? 0 : Math.sign(bx) * 2)));
      const iy = Math.max(0, Math.min(height - 1, y + (by === 0 ? 0 : Math.sign(by) * 2)));
      const j = iy * width + ix;
      if (src[j * 4 + 3] < 200) { out.data[i * 4 + 3] = Math.min(a, 90); continue; }
      const [h2, s2] = rgbToHsv(src[j * 4], src[j * 4 + 1], src[j * 4 + 2]);
      if (isFringeHue(h2, s2)) continue; // genuinely red garment
      out.data[i * 4] = src[j * 4];
      out.data[i * 4 + 1] = src[j * 4 + 1];
      out.data[i * 4 + 2] = src[j * 4 + 2];
      out.data[i * 4 + 3] = Math.min(a, 200);
    }
    cur = out;
  }
  return cur;
}

// Softens binary alpha edges and removes specks.
export function featherAlpha(img, { speck = 12 } = {}) {
  const { width, height } = img;
  const out = cloneImage(img);
  const { labels, comps } = components(width, height, (i) => img.data[i * 4 + 3] > A_T);
  for (let i = 0; i < width * height; i++) {
    const l = labels[i];
    if (l !== -1 && comps[l].size < speck) out.data[i * 4 + 3] = 0;
  }
  const a = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) a[i] = out.data[i * 4 + 3];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (a[i] === 0) continue;
    let transparentN = 0, total = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      total++;
      if (a[ny * width + nx] === 0) transparentN++;
    }
    if (transparentN > 0) out.data[i * 4 + 3] = Math.round(a[i] * (1 - 0.55 * transparentN / total));
  }
  return out;
}

// Hue remap: pixels with saturation > minSat whose hue lies in [h0,h1] (wrapping) get hue + delta.
export function hueRemap(img, { h0, h1, delta, minSat = 0.3 }) {
  const out = cloneImage(img);
  const n = img.width * img.height;
  const inRange = (h) => (h0 <= h1 ? h >= h0 && h <= h1 : h >= h0 || h <= h1);
  for (let i = 0; i < n; i++) {
    if (img.data[i * 4 + 3] === 0) continue;
    const [h, s, v] = rgbToHsv(img.data[i * 4], img.data[i * 4 + 1], img.data[i * 4 + 2]);
    if (s < minSat || !inRange(h)) continue;
    const [r, g, b] = hsvToRgb((h + delta + 360) % 360, s, v);
    out.data[i * 4] = r; out.data[i * 4 + 1] = g; out.data[i * 4 + 2] = b;
  }
  return out;
}

export function tint(img, [tr, tg, tb], amount = 0.5) {
  const out = cloneImage(img);
  const n = img.width * img.height;
  for (let i = 0; i < n; i++) {
    if (img.data[i * 4 + 3] === 0) continue;
    for (let c = 0; c < 3; c++) {
      const v = img.data[i * 4 + c];
      out.data[i * 4 + c] = Math.round(v * (1 - amount) + [tr, tg, tb][c] * amount);
    }
  }
  return out;
}

// Nearest-neighbour-free bilinear resize for RGBA (premultiplied to avoid dark halos).
export function resize(img, scale) {
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const out = makeImage(w, h);
  const { width, height, data } = img;
  for (let y = 0; y < h; y++) {
    const sy = Math.min(height - 1, (y + 0.5) / scale - 0.5);
    const y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(height - 1, y0 + 1), fy = sy - y0;
    for (let x = 0; x < w; x++) {
      const sx = Math.min(width - 1, (x + 0.5) / scale - 0.5);
      const x0 = Math.max(0, Math.floor(sx)), x1 = Math.min(width - 1, x0 + 1), fx = sx - x0;
      let r = 0, g = 0, b = 0, a = 0;
      const samples = [[x0, y0, (1 - fx) * (1 - fy)], [x1, y0, fx * (1 - fy)], [x0, y1, (1 - fx) * fy], [x1, y1, fx * fy]];
      for (const [px, py, wgt] of samples) {
        const i = (py * width + px) * 4;
        const pa = data[i + 3] / 255 * wgt;
        r += data[i] * pa; g += data[i + 1] * pa; b += data[i + 2] * pa; a += pa;
      }
      const o = (y * w + x) * 4;
      if (a > 0) { out.data[o] = Math.round(r / a); out.data[o + 1] = Math.round(g / a); out.data[o + 2] = Math.round(b / a); }
      out.data[o + 3] = Math.round(a * 255);
    }
  }
  return out;
}

// Head anchor estimation for hero frames. Returns { x, y, w, angle, method } in cell pixel coordinates.
const isSkinPx = (data, i) => {
  if (data[i * 4 + 3] < 200) return false;
  const [h, s, v] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  return h >= 6 && h <= 42 && s >= 0.2 && s <= 0.72 && v >= 0.45;
};

// Skin blobs of the main figure. The mask is opened (eroded `r` px, then the surviving blobs grown back
// over the original mask) so a face touching a raised fist or a bare shoulder splits into separate
// blobs instead of one merged one whose centroid lands on the neck or chest.
function skinBlobs(cell, mainComp, labels, r = 2) {
  const { width, height, data } = cell;
  const n = width * height;
  const skin = new Uint8Array(n);
  for (let y = mainComp.y0; y <= mainComp.y1; y++) for (let x = mainComp.x0; x <= mainComp.x1; x++) {
    const i = y * width + x;
    if ((!labels || labels[i] === mainComp.id) && isSkinPx(data, i)) skin[i] = 1;
  }
  let core = skin;
  for (let it = 0; it < r; it++) {
    const next = new Uint8Array(n);
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!core[i]) continue;
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (!core[i + dy * width + dx]) { ok = false; break; }
      if (ok) next[i] = 1;
    }
    core = next;
  }
  const { labels: lab } = components(width, height, (i) => core[i] === 1);
  for (let it = 0; it < r; it++) {
    const src = Int32Array.from(lab);
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!skin[i] || src[i] !== -1) continue;
      for (let dy = -1; dy <= 1 && lab[i] === -1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const l = src[i + dy * width + dx];
        if (l !== -1) { lab[i] = l; break; }
      }
    }
  }
  const blobs = new Map();
  for (let i = 0; i < n; i++) {
    const l = lab[i];
    if (l === -1) continue;
    const x = i % width, y = (i / width) | 0;
    let b = blobs.get(l);
    if (!b) { b = { size: 0, x0: x, y0: y, x1: x, y1: y, sx: 0, sy: 0 }; blobs.set(l, b); }
    b.size++; b.sx += x; b.sy += y;
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
  }
  return [...blobs.values()].map((b) => {
    const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
    return { ...b, cx: b.sx / b.size, cy: b.sy / b.size, w: Math.max(bw, bh), aspect: Math.min(bw, bh) / Math.max(bw, bh) };
  });
}

// Finds the face of the main figure. Heroes have bare arms, so "largest skin blob" is usually a forearm;
// instead the face is scored as the highest-topped, most compact skin blob whose size matches `ref`
// (the hero's reference face, measured on the idle row): fists are far too small, arms and torsos too
// big and elongated. Without `ref` (the reference pass) size is ignored beyond a minimum.
export function headAnchor(cell, mainComp, labels, ref = null) {
  if (!mainComp) return null;
  const { width, data } = cell;
  const fh = mainComp.y1 - mainComp.y0 + 1;
  const minSize = ref ? ref.size * 0.3 : 60;
  const blobs = skinBlobs(cell, mainComp, labels);
  // No skin anywhere means no figure (a projectile-only frame), not a hidden face: report no head.
  if (blobs.reduce((n, b) => n + b.size, 0) < (ref ? ref.size * 0.1 : 20)) return null;
  let best = null, bestScore = Infinity;
  for (const b of blobs) {
    if (b.size < minSize) continue;
    const top = (b.y0 - mainComp.y0) / fh;
    if (top > 0.55) continue;
    const sizePen = ref ? Math.abs(Math.log(b.size / ref.size)) : 0;
    const score = top * 4 + sizePen * 0.6 + (1 - b.aspect) * 0.8;
    if (score < bestScore) { bestScore = score; best = b; }
  }
  if (best) return { x: best.cx, y: best.cy, w: best.w, size: best.size, angle: 0, method: 'skin' };
  // silhouette fallback: the topmost 18% of figure rows
  const band = Math.max(4, Math.round(fh * 0.18));
  let sx = 0, sy = 0, n = 0, minX = width, maxX = 0;
  for (let y = mainComp.y0; y < mainComp.y0 + band; y++) for (let x = mainComp.x0; x <= mainComp.x1; x++) {
    const i = y * width + x;
    if (labels && labels[i] !== mainComp.id) continue;
    if (data[i * 4 + 3] < 200) continue;
    sx += x; sy += y; n++;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
  }
  if (n === 0) return null;
  const bw = maxX - minX + 1;
  return { x: sx / n, y: sy / n + band * 0.55, w: Math.max(8, bw * 0.7), angle: 0, method: 'silhouette' };
}

// Samples a representative skin colour and outline colour from the main component's head region.
export function sampleColours(cell, anchor) {
  const { width, height, data } = cell;
  if (!anchor) return { skin: [214, 160, 120], outline: [24, 18, 30] };
  const r = Math.max(4, anchor.w * 0.6);
  const skinPx = [], dark = [];
  for (let y = Math.max(0, Math.floor(anchor.y - r)); y <= Math.min(height - 1, Math.ceil(anchor.y + r)); y++) {
    for (let x = Math.max(0, Math.floor(anchor.x - r)); x <= Math.min(width - 1, Math.ceil(anchor.x + r)); x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 200) continue;
      const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
      if (h >= 6 && h <= 42 && s >= 0.2 && s <= 0.72 && v >= 0.45) skinPx.push([data[i], data[i + 1], data[i + 2]]);
      if (v < 0.25) dark.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  const avg = (arr, fallback) => arr.length ? arr.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map((v) => Math.round(v / arr.length)) : fallback;
  return { skin: avg(skinPx, [214, 160, 120]), outline: avg(dark, [24, 18, 30]) };
}

// Simple shelf packer. items: [{w,h,key}] → { width, height, places: {key:{x,y}} }
export function shelfPack(items, maxWidth = 2048, pad = 2) {
  const sorted = [...items].sort((a, b) => b.h - a.h);
  const places = {};
  let x = pad, y = pad, shelfH = 0, width = 0;
  for (const it of sorted) {
    if (x + it.w + pad > maxWidth) { x = pad; y += shelfH + pad; shelfH = 0; }
    places[it.key] = { x, y };
    x += it.w + pad;
    if (it.h > shelfH) shelfH = it.h;
    if (x > width) width = x;
  }
  const height = y + shelfH + pad;
  const pow2 = (v) => { let p = 64; while (p < v) p *= 2; return p; };
  return { width: pow2(width), height: pow2(height), places };
}

export function drawRect(img, x0, y0, w, h, [r, g, b], a = 255) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
    if (x !== x0 && y !== y0 && x !== x0 + w - 1 && y !== y0 + h - 1) continue;
    const i = (y * img.width + x) * 4;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = a;
  }
}

export function drawLine(img, x0, y0, x1, y1, [r, g, b]) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + (x1 - x0) * (s / Math.max(1, steps)));
    const y = Math.round(y0 + (y1 - y0) * (s / Math.max(1, steps)));
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
    const i = (y * img.width + x) * 4;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
}

export function drawCircle(img, cx, cy, rad, colour) {
  const n = Math.max(12, Math.round(rad * 4));
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
    drawLine(img, cx + Math.cos(a0) * rad, cy + Math.sin(a0) * rad, cx + Math.cos(a1) * rad, cy + Math.sin(a1) * rad, colour);
  }
}
