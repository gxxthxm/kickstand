// Renders the Kickstand gauge mark to PNG app icons (no image dependencies).
// Usage: node scripts/gen-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const ACCENT = [0xc6, 0xf4, 0x32];
const INK = [0x0a, 0x0a, 0x0a];

// The mark, in the same 32×32 space as src/components/Logo.tsx.
const C = { x: 16, y: 17.5 };
const R = 8.5;
const ARC_END_Y = 21.5;
const STROKE = 1.3; // half of 2.6
const NEEDLE = [C, { x: 21, y: 11 }];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function segDist(p, a, b) {
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / dist(a, b) ** 2),
  );
  return dist(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

function arcDist(p) {
  const d = dist(p, C) || 1e-6;
  const qy = C.y + (R * (p.y - C.y)) / d;
  if (qy <= ARC_END_Y) return Math.abs(d - R);
  const ends = [
    { x: 16 - 7.5, y: ARC_END_Y },
    { x: 16 + 7.5, y: ARC_END_Y },
  ];
  return Math.min(dist(p, ends[0]), dist(p, ends[1]));
}

function roundRectInside(p, size, radius) {
  const qx = Math.max(Math.abs(p.x - size / 2) - (size / 2 - radius), 0);
  const qy = Math.max(Math.abs(p.y - size / 2) - (size / 2 - radius), 0);
  return Math.hypot(qx, qy) <= radius;
}

/** Colour at a point in mark space, or null for transparent. */
function sample(p, { rounded }) {
  if (rounded && !roundRectInside(p, 32, 9)) return null;
  if (!rounded && (p.x < 0 || p.y < 0 || p.x > 32 || p.y > 32)) return null;
  const ink =
    arcDist(p) <= STROKE || segDist(p, NEEDLE[0], NEEDLE[1]) <= STROKE || dist(p, C) <= 2.4;
  return ink ? INK : ACCENT;
}

function render(size, { rounded, scale = 1 }) {
  const ss = 4;
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const u = ((x + (sx + 0.5) / ss) / size) * 32;
          const v = ((y + (sy + 0.5) / ss) / size) * 32;
          // Shrink the mark (not the background) toward the centre for maskable safe zones.
          const m = { x: 16 + (u - 16) / scale, y: 16 + (v - 16) / scale };
          let col = sample({ x: u, y: v }, { rounded });
          if (col && scale !== 1) col = sample(m, { rounded: false }) === INK ? INK : ACCENT;
          if (!col) continue;
          r += col[0];
          g += col[1];
          b += col[2];
          a += 255;
        }
      }
      const n = ss * ss;
      const i = (y * size + x) * 4;
      const cov = a / n;
      px[i] = cov ? Math.round((r / n) * (255 / cov)) : 0;
      px[i + 1] = cov ? Math.round((g / n) * (255 / cov)) : 0;
      px[i + 2] = cov ? Math.round((b / n) * (255 / cov)) : 0;
      px[i + 3] = Math.round(cov);
    }
  }
  return encodePNG(size, px);
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++)
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = (name, buf) => {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), buf);
  console.log(`public/${name}`);
};
out('pwa-192.png', render(192, { rounded: true }));
out('pwa-512.png', render(512, { rounded: true }));
out('pwa-maskable-512.png', render(512, { rounded: false, scale: 0.72 }));
out('apple-touch-icon.png', render(180, { rounded: false, scale: 0.85 }));
