// ai-excited-01 entry v2 — "Celestial Angel Scattering Planets".
//
// A colossal winged celestial being, seen three-quarter, scattering a
// handful of glowing planets from its open hand into a spiral galaxy
// below. The image is the entry; this program only places its exact
// bytes where the grader expects them, then proves the copy landed
// whole. No network, no randomness, no re-encoding: every run writes
// the identical file, or fails loudly instead of passing silently.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const source = join(repoDir, "entry.png");
const target = join(outDir, "entry.png");

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function dimensions(bytes: Buffer): { width: number; height: number } {
  // PNG: width/height are the first 8 bytes of the IHDR chunk.
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  // JPEG: walk segments until a Start Of Frame marker gives dimensions.
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) throw new Error("entry.png: corrupt JPEG marker");
      const marker = bytes[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: bytes.readUInt16BE(i + 7), height: bytes.readUInt16BE(i + 5) };
      }
      const len = bytes.readUInt16BE(i + 2);
      i += 2 + len;
    }
    throw new Error("entry.png: no JPEG frame found");
  }
  throw new Error("entry.png: not a PNG or JPEG (magic bytes mismatch)");
}

// Gate the source before copying: the entry must already be legal.
const bytes = readFileSync(source);
if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png too large: ${bytes.length} bytes > ${MAX_BYTES}`);
}
const { width, height } = dimensions(bytes);
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(`entry.png too big: ${width}x${height} > ${MAX_SIDE}x${MAX_SIDE}`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

// Integrity: the copy must be byte-identical to the source.
if (statSync(target).size !== bytes.length) {
  throw new Error("entry.png copy incomplete: size mismatch");
}
if (sha256(target) !== sha256(source)) {
  throw new Error("entry.png copy incomplete: sha256 mismatch");
}
