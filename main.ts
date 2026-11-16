// ai-excited-01 entry — "Whale in a Cup".
//
// The image is the entry: a colossal crystalline whale breaching out of a
// tiny espresso cup, frozen mid-burst. This program does nothing clever to
// it; it simply places the exact bytes where the grader expects them, so
// every run produces the identical file. After copying it checks the output
// really landed whole — a half-written file must fail loudly, never pass
// silently.
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const source = join(repoDir, "entry.png");
const target = join(outDir, "entry.png");

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
if (statSync(target).size !== statSync(source).size) {
  throw new Error("entry.png copy incomplete: size mismatch");
}
