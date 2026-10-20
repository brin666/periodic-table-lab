import test from "node:test";
import assert from "node:assert/strict";
import {
  CONNECTION_SEGMENTS,
  CONNECTION_WAVE_AMPLITUDE,
  CONNECTION_WAVE_MS,
  connectionCubicControls,
  connectionCubicPath,
  connectionEase,
  connectionGeometry,
  connectionPath,
  connectionWaveOffset,
  deformConnection,
  interpolateConnection,
  sampleConnection,
  segmentContact,
  sweepConnection,
} from "../src/knowledge-connection-motion";

test("curve sampling has stable topology and exact endpoints through interrupted layout changes", () => {
  const a = sampleConnection({ x: 0, y: 0 }, { x: 600, y: 180 });
  const b = sampleConnection({ x: -80, y: 20 }, { x: 250, y: -330 });
  assert.equal(a.length, CONNECTION_SEGMENTS + 1);
  assert.deepEqual(a[0], { x: 0, y: 0 });
  assert.deepEqual(a.at(-1), { x: 600, y: 180 });
  const halfway = interpolateConnection(a, b, 0.5);
  const rebased = interpolateConnection(halfway, a, 0);
  assert.deepEqual(rebased, halfway);
  assert.equal(
    (connectionPath(a).match(/ C /g) ?? []).length,
    CONNECTION_SEGMENTS,
  );
  assert.equal(
    (connectionPath(b).match(/ C /g) ?? []).length,
    CONNECTION_SEGMENTS,
  );
  assert.ok(
    halfway.every(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
    ),
  );
});

test("one recovered cubic exactly represents original and intermediate layout samples", () => {
  const a = sampleConnection({ x: -24, y: 50 }, { x: 615, y: -180 });
  const b = sampleConnection({ x: 80, y: -30 }, { x: -420, y: 350 });
  const collapsed = sampleConnection({ x: 80, y: -30 }, { x: 80, y: -30 });
  for (const points of [
    a,
    b,
    collapsed,
    ...[0.17, 0.5, 0.83].map((t) => interpolateConnection(a, b, t)),
  ]) {
    const [from, first, second, to] = connectionCubicControls(points);
    assert.deepEqual(from, points[0]);
    assert.deepEqual(to, points.at(-1));
    assert.equal((connectionCubicPath(points).match(/ C /g) ?? []).length, 1);
    for (let index = 0; index <= CONNECTION_SEGMENTS; index++) {
      const t = index / CONNECTION_SEGMENTS,
        q = 1 - t;
      const restored = {
        x:
          q ** 3 * from.x +
          3 * q * q * t * first.x +
          3 * q * t * t * second.x +
          t ** 3 * to.x,
        y:
          q ** 3 * from.y +
          3 * q * q * t * first.y +
          3 * q * t * t * second.y +
          t ** 3 * to.y,
      };
      assert.ok(
        Math.hypot(restored.x - points[index].x, restored.y - points[index].y) <
          1e-9,
        `sample ${index} retains the same cubic geometry`,
      );
    }
  }
});

test("reveal easing accelerates then decelerates and clamps exactly at both ends", () => {
  assert.equal(connectionEase(-1), 0);
  assert.equal(connectionEase(2), 1);
  const positions = Array.from({ length: 21 }, (_, i) =>
    connectionEase(i / 20),
  );
  assert.ok(
    positions.every((value, i) => i === 0 || value >= positions[i - 1]),
  );
  const earlySpeed = connectionEase(0.1) - connectionEase(0);
  const middleSpeed = connectionEase(0.55) - connectionEase(0.45);
  const finalSpeed = connectionEase(1) - connectionEase(0.9);
  assert.ok(middleSpeed > earlySpeed * 4);
  assert.ok(middleSpeed > finalSpeed * 4);
});

test("pointer sweeps detect crossed curved segments, use screen tolerance, and reject a stationary pointer", () => {
  const curve = sampleConnection({ x: 0, y: 0 }, { x: 600, y: 180 });
  const middle = curve[48];
  const hit = sweepConnection(
    curve,
    { x: middle.x, y: middle.y - 30 },
    { x: middle.x, y: middle.y + 30 },
  );
  assert.ok(hit && hit.position > 0.35 && hit.position < 0.65);
  assert.equal(sweepConnection(curve, middle, middle), null);
  const straight = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ];
  assert.ok(sweepConnection(straight, { x: 40, y: 2.9 }, { x: 60, y: 2.9 }));
  assert.equal(
    sweepConnection(straight, { x: 40, y: 3.1 }, { x: 60, y: 3.1 }),
    null,
  );
  assert.deepEqual(
    segmentContact(
      { x: 50, y: -100 },
      { x: 50, y: 100 },
      straight[0],
      straight[1],
    ),
    { distance: 0, curveT: 0.5 },
  );
});

test("one touch creates local crests and troughs that travel both ways with fixed ends", () => {
  const geometry = connectionGeometry(
    sampleConnection({ x: 0, y: 0 }, { x: 800, y: 0 }),
  );
  const waves = [{ position: 0.5, started: 0, polarity: 1 }];
  const at = (arc: number, time: number) =>
    connectionWaveOffset(arc, geometry.totalLength, waves, time, 1);
  assert.equal(at(0, 0), 0);
  assert.equal(at(800, 180), 0);
  assert.equal(at(400, 0), CONNECTION_WAVE_AMPLITUDE);
  assert.ok(
    at(430, 0) < 0,
    "the neighboring trough is distinct from the local crest",
  );
  assert.ok(Math.abs(at(600, 0)) < 0.001, "the whole line never translates");
  const front = 110 * (100 / CONNECTION_WAVE_MS);
  assert.ok(at(400 + front, 100) > at(400, 100));
  assert.ok(Math.abs(at(400 + front, 100) - at(400 - front, 100)) < 1e-9);
  const deformed = deformConnection(geometry, waves, 100, 1);
  assert.deepEqual(deformed[0], geometry.points[0]);
  assert.deepEqual(deformed.at(-1), geometry.points.at(-1));
  assert.notDeepEqual(deformed[48], geometry.points[48]);
  for (const arc of [100, 350, 400, 450, 700]) {
    assert.equal(at(arc, CONNECTION_WAVE_MS), 0);
    assert.equal(at(arc, CONNECTION_WAVE_MS + 1000), 0);
  }
});

test("wave amplitude stays within screen pixels across camera scales and repeated touches", () => {
  const waves = [{ position: 0.5, started: 0, polarity: 1 }];
  for (const scale of [0.25, 0.5, 1, 1.5, 2]) {
    const screenPeak = connectionWaveOffset(400, 800, waves, 0, scale) * scale;
    assert.ok(screenPeak >= 3 && screenPeak <= 5);
    const repeatedPeak =
      connectionWaveOffset(400, 800, [...waves, ...waves], 0, scale) * scale;
    assert.ok(repeatedPeak <= 5);
    for (let arc = 0; arc <= 800; arc += 4)
      assert.ok(
        Math.abs(connectionWaveOffset(arc, 800, waves, 60, scale) * scale) <=
          CONNECTION_WAVE_AMPLITUDE + 1e-9,
      );
  }
});

test("degenerate collapsed lines have finite geometry and cannot receive a pluck", () => {
  const curve = sampleConnection({ x: 50, y: 20 }, { x: 50, y: 20 });
  const geometry = connectionGeometry(curve);
  assert.ok(geometry.totalLength < 1e-9);
  assert.equal(sweepConnection(curve, { x: 49, y: 0 }, { x: 51, y: 40 }), null);
  assert.ok(
    deformConnection(
      geometry,
      [{ position: 0.5, started: 0, polarity: 1 }],
      80,
      0.25,
    ).every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
  );
});
