// ai-excited-01 entry, revision v3-moth —
// "The Lighthouse Keeper Called In Sick, So a Moth Took the Shift."
//
// The picture is the whole entry: a giant glowing moth has taken over
// the lamp room of a dark, empty coastal lighthouse at night. The moth's
// amber body and wings are the only light in the frame — the moth IS the
// lamp — and a warm beam sweeps from its wings across the sea while
// small fishing boats follow the light home.
//
// This program is deliberately boring. It carries the exact bytes of
// entry.png into the grader's output directory and checks the copy
// before it finishes: right file type, right size, right shape, same
// hash. No network, no clock, no dice, no re-encoding — run it twice
// and the output is byte for byte the same.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The competition's hard caps, straight from RULES.txt.
const MAX_BYTES = 1048576; // 1 MiB.
const MAX_SIDE = 1024; // No side may exceed 1024 px.

const PNG_MAGIC = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8]);

const root = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(root, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outPath = join(outDir, "entry.png");

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// Read width and height out of the file's own header, so the check
// trusts the bytes themselves and nothing else.
function dimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length >= 2 && bytes.subarray(0, 2).equals(JPEG_MAGIC)) {
    let cursor = 2;
    while (cursor + 9 < bytes.length) {
      if (bytes[cursor] !== 0xff) {
        throw new Error("entry.png is not a well-formed JPEG");
      }
      const marker = bytes[cursor + 1];
      const frame =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (frame) {
        return {
          width: bytes.readUInt16BE(cursor + 7),
          height: bytes.readUInt16BE(cursor + 5),
        };
      }
      cursor += 2 + bytes.readUInt16BE(cursor + 2);
    }
    throw new Error("entry.png has no JPEG frame header");
  }
  throw new Error("entry.png is neither PNG nor JPEG");
}

const bytes = readFileSync(sourcePath);

if (bytes.length > MAX_BYTES) {
  throw new Error(
    `entry.png is ${bytes.length} bytes, over the ${MAX_BYTES} limit`,
  );
}

const { width, height } = dimensions(bytes);
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(
    `entry.png is ${width}x${height}, over ${MAX_SIDE}x${MAX_SIDE}`,
  );
}

mkdirSync(outDir, { recursive: true });
copyFileSync(sourcePath, outPath);

// The run only counts if the copy landed whole.
const copied = readFileSync(outPath);
if (copied.length !== bytes.length) {
  throw new Error("entry.png copy is short: byte count does not match");
}
if (sha256Hex(copied) !== sha256Hex(bytes)) {
  throw new Error("entry.png copy is corrupt: sha256 does not match");
}
