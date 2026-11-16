// ai-excited-01 entry, revision v2-r1 — "Celestial Angel Scattering Planets".
//
// The picture is the entry: a timeless winged celestial being scattering
// seven large glowing worlds from its open hand into a spiral galaxy
// below. This program does nothing creative. It moves the exact bytes of
// entry.png into the grader's output directory and refuses to finish
// unless the copy is whole: right size, right shape, identical hash.
// It never touches the network, never rolls dice, never re-encodes the
// image — run it twice or two hundred times and the bytes are the same.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BYTE_LIMIT = 1048576; // 1 MiB, the competition's file cap.
const SIDE_LIMIT = 1024; // No side of the image may exceed this.

const here = dirname(fileURLToPath(import.meta.url));
const input = join(here, "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const output = join(outputDir, "entry.png");

function fingerprint(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readSize(bytes: Buffer): { width: number; height: number } {
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(pngMagic)) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    // JPEG: step through the segments until the frame header reports size.
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        throw new Error("entry.png is not a well-formed JPEG");
      }
      const marker = bytes[offset + 1];
      const isFrame =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isFrame) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      }
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
    throw new Error("entry.png has no JPEG frame header");
  }
  throw new Error("entry.png is neither PNG nor JPEG");
}

if (!existsSync(input)) {
  throw new Error("entry.png is missing from the repository");
}
const data = readFileSync(input);
if (data.length > BYTE_LIMIT) {
  throw new Error(`entry.png is ${data.length} bytes, over the ${BYTE_LIMIT} limit`);
}
const size = readSize(data);
if (size.width > SIDE_LIMIT || size.height > SIDE_LIMIT) {
  throw new Error(`entry.png is ${size.width}x${size.height}, over ${SIDE_LIMIT}x${SIDE_LIMIT}`);
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(input, output);

// Prove the copy landed whole before calling the run a success.
if (statSync(output).size !== data.length) {
  throw new Error("entry.png copy is short: byte count does not match the source");
}
if (fingerprint(output) !== fingerprint(input)) {
  throw new Error("entry.png copy is corrupt: sha256 does not match the source");
}
