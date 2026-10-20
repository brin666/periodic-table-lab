import type { MapPoint } from "./knowledge-layout";

export const CONNECTION_REVEAL_MS = 260;
export const CONNECTION_LAYOUT_MS = 280;
export const CONNECTION_WAVE_MS = 380;
export const CONNECTION_SEGMENTS = 96;
export const CONNECTION_WAVE_AMPLITUDE = 4.8;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const distance = (a: MapPoint, b: MapPoint) => Math.hypot(b.x - a.x, b.y - a.y);

/** CSS cubic-bezier(.77, 0, .175, 1), evaluated in time rather than parameter space. */
export function connectionEase(progress: number): number {
  const x = clamp(progress, 0, 1);
  if (x === 0 || x === 1) return x;
  const cubic = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
  let low = 0,
    high = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    if (cubic(mid, 0.77, 0.175) < x) low = mid;
    else high = mid;
  }
  return cubic((low + high) / 2, 0, 1);
}

/** Same controls as mapConnection, with stable topology for layout and wave deformation. */
export function sampleConnection(from: MapPoint, to: MapPoint): MapPoint[] {
  const dx = to.x - from.x;
  const a = { x: from.x + dx * 0.48, y: from.y };
  const b = { x: to.x - dx * 0.3, y: to.y };
  return Array.from({ length: CONNECTION_SEGMENTS + 1 }, (_, index) => {
    const t = index / CONNECTION_SEGMENTS,
      q = 1 - t;
    return {
      x:
        q ** 3 * from.x +
        3 * q * q * t * a.x +
        3 * q * t * t * b.x +
        t ** 3 * to.x,
      y:
        q ** 3 * from.y +
        3 * q * q * t * a.y +
        3 * q * t * t * b.y +
        t ** 3 * to.y,
    };
  });
}

export function interpolateConnection(
  from: MapPoint[],
  to: MapPoint[],
  progress: number,
): MapPoint[] {
  const t = clamp(progress, 0, 1);
  return to.map((point, index) => ({
    x: mix(from[index].x, point.x, t),
    y: mix(from[index].y, point.y, t),
  }));
}

export interface ConnectionGeometry {
  points: MapPoint[];
  lengths: number[];
  totalLength: number;
}

export function connectionGeometry(points: MapPoint[]): ConnectionGeometry {
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]));
  return { points, lengths, totalLength: lengths.at(-1) ?? 0 };
}

export interface ConnectionWave {
  /** Position along the visible curve's arc, independent of camera scale. */
  position: number;
  started: number;
  polarity: number;
}

/** One outgoing crest/trough packet on each side; no oscillator or recurring pulse. */
export function connectionWaveOffset(
  arc: number,
  totalLength: number,
  waves: ConnectionWave[],
  now: number,
  scale: number,
): number {
  if (totalLength < 0.001 || arc <= 0 || arc >= totalLength) return 0;
  const zoom = Math.max(0.001, scale);
  const edge = Math.min(
    1,
    (arc * zoom) / 20,
    ((totalLength - arc) * zoom) / 20,
  );
  let offset = 0;
  for (const wave of waves) {
    const age = (now - wave.started) / CONNECTION_WAVE_MS;
    if (age < 0 || age >= 1) continue;
    const d = Math.abs(arc - wave.position * totalLength) * zoom;
    const phase = d - age * 110;
    const packet = Math.cos(phase / 10) * Math.exp(-0.5 * (phase / 24) ** 2);
    offset +=
      CONNECTION_WAVE_AMPLITUDE *
      wave.polarity *
      packet *
      (1 - age) ** 1.35 *
      edge;
  }
  return (
    clamp(offset, -CONNECTION_WAVE_AMPLITUDE, CONNECTION_WAVE_AMPLITUDE) / zoom
  );
}

export function deformConnection(
  geometry: ConnectionGeometry,
  waves: ConnectionWave[],
  now: number,
  scale: number,
): MapPoint[] {
  const { points, lengths, totalLength } = geometry;
  if (!waves.length) return points;
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point;
    const before = points[index - 1],
      after = points[index + 1];
    const dx = after.x - before.x,
      dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    const amount = connectionWaveOffset(
      lengths[index],
      totalLength,
      waves,
      now,
      scale,
    );
    return {
      x: point.x - (dy / length) * amount,
      y: point.y + (dx / length) * amount,
    };
  });
}

const coordinate = (value: number) => Number(value.toFixed(3));

/** Recover a cubic exactly from its uniform samples, including a blend of cubics. */
export function connectionCubicControls(
  points: MapPoint[],
): [MapPoint, MapPoint, MapPoint, MapPoint] {
  const end = points.length - 1;
  const from = points[0],
    to = points[end];
  const third = points[end / 3],
    twoThirds = points[(end * 2) / 3];
  const a = {
    x: 27 * third.x - 8 * from.x - to.x,
    y: 27 * third.y - 8 * from.y - to.y,
  };
  const b = {
    x: 27 * twoThirds.x - from.x - 8 * to.x,
    y: 27 * twoThirds.y - from.y - 8 * to.y,
  };
  return [
    from,
    { x: (2 * a.x - b.x) / 18, y: (2 * a.y - b.y) / 18 },
    { x: (2 * b.x - a.x) / 18, y: (2 * b.y - a.y) / 18 },
    to,
  ];
}

/** Resting and layout curves need only one cubic; reserve dense paths for waves. */
export function connectionCubicPath(points: MapPoint[]): string {
  const [from, first, second, to] = connectionCubicControls(points);
  return `M ${coordinate(from.x)} ${coordinate(from.y)} C ${coordinate(first.x)} ${coordinate(first.y)} ${coordinate(second.x)} ${coordinate(second.y)} ${coordinate(to.x)} ${coordinate(to.y)}`;
}

/** Catmull–Rom interpolation keeps the sampled waves smooth, including at large zoom. */
export function connectionPath(points: MapPoint[]): string {
  if (!points.length) return "";
  let result = `M ${coordinate(points[0].x)} ${coordinate(points[0].y)}`;
  for (let index = 0; index < points.length - 1; index++) {
    const a = points[Math.max(0, index - 1)],
      b = points[index];
    const c = points[index + 1],
      d = points[Math.min(points.length - 1, index + 2)];
    result += ` C ${coordinate(b.x + (c.x - a.x) / 6)} ${coordinate(b.y + (c.y - a.y) / 6)} ${coordinate(c.x - (d.x - b.x) / 6)} ${coordinate(c.y - (d.y - b.y) / 6)} ${coordinate(c.x)} ${coordinate(c.y)}`;
  }
  return result;
}

function project(point: MapPoint, a: MapPoint, b: MapPoint): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  return length
    ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / length, 0, 1)
    : 0;
}

/** Closest distance between two finite segments, including a full crossing between events. */
export function segmentContact(
  a: MapPoint,
  b: MapPoint,
  c: MapPoint,
  d: MapPoint,
): { distance: number; curveT: number } {
  const ab = { x: b.x - a.x, y: b.y - a.y },
    cd = { x: d.x - c.x, y: d.y - c.y };
  const cross = ab.x * cd.y - ab.y * cd.x;
  if (Math.abs(cross) > 1e-9) {
    const ca = { x: c.x - a.x, y: c.y - a.y };
    const t = (ca.x * cd.y - ca.y * cd.x) / cross;
    const u = (ca.x * ab.y - ca.y * ab.x) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { distance: 0, curveT: u };
  }
  const onCurve = (point: MapPoint) => {
    const curveT = project(point, c, d);
    return {
      distance: distance(point, {
        x: mix(c.x, d.x, curveT),
        y: mix(c.y, d.y, curveT),
      }),
      curveT,
    };
  };
  const onPointer = (point: MapPoint, curveT: number) => {
    const t = project(point, a, b);
    return {
      distance: distance(point, { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }),
      curveT,
    };
  };
  return [onCurve(a), onCurve(b), onPointer(c, 0), onPointer(d, 1)].reduce(
    (best, candidate) =>
      candidate.distance < best.distance ? candidate : best,
  );
}

export function sweepConnection(
  points: MapPoint[],
  previous: MapPoint,
  current: MapPoint,
  tolerance = 3,
): { position: number; polarity: number } | null {
  // A camera transform under an unchanged client coordinate is never an input gesture.
  if (distance(previous, current) < 0.5) return null;
  const { lengths, totalLength } = connectionGeometry(points);
  if (totalLength < 1) return null;
  let closest = tolerance,
    hit: { position: number; polarity: number } | null = null;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1],
      b = points[index];
    const contact = segmentContact(previous, current, a, b);
    if (contact.distance > closest) continue;
    closest = contact.distance;
    const normalMotion =
      (current.y - previous.y) * (b.x - a.x) -
      (current.x - previous.x) * (b.y - a.y);
    hit = {
      position:
        (lengths[index - 1] +
          (lengths[index] - lengths[index - 1]) * contact.curveT) /
        totalLength,
      polarity: normalMotion < 0 ? -1 : 1,
    };
  }
  return hit;
}
