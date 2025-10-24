/*
  Clean Next.js export artifacts that can break Firebase Hosting deploys on Windows.
  Removes:
  - Any directories starting with "__next." inside the out/ folder (symlink-like analyzer dirs)
  - Any files starting with "__next." and ending with .txt
  - Any files named exactly "index.txt"

  Usage: runs automatically via npm postbuild
*/

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const OUT_DIR = path.resolve(process.cwd(), 'out');

async function removeTarget(p) {
  try {
    const stat = await fsp.lstat(p);
    if (stat.isDirectory()) {
      await fsp.rm(p, { recursive: true, force: true });
      console.log(`[clean-out] removed directory: ${path.relative(OUT_DIR, p)}`);
    } else {
      await fsp.unlink(p);
      console.log(`[clean-out] removed file: ${path.relative(OUT_DIR, p)}`);
    }
  } catch (err) {
    // ignore ENOENT and continue
  }
}

function shouldRemove(name, isDir) {
  if (isDir) {
    return name.startsWith('__next.');
  }
  if (name === 'index.txt') return true;
  if (name.startsWith('__next.') && name.endsWith('.txt')) return true;
  return false;
}

async function walk(dir) {
  let entries = [];
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch (err) {
    return; // Skip unreadable dirs
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const isDir = entry.isDirectory();
    if (shouldRemove(entry.name, isDir)) {
      await removeTarget(full);
      // If we removed a directory, skip walking into it
      continue;
    }

    // Recurse into directories
    if (isDir) {
      await walk(full);
    }
  }
}

async function main() {
  try {
    const st = await fsp.stat(OUT_DIR);
    if (!st.isDirectory()) return;
  } catch (e) {
    // out/ doesn't exist, nothing to do
    return;
  }
  await walk(OUT_DIR);
}

main().catch((e) => {
  console.warn('[clean-out] error:', e?.message || e);
  process.exitCode = 0; // don't fail the build
});
