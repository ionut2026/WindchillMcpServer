import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cli = join(root, "src", "cli.js");

function run(args, exportDir) {
  const env = { ...process.env };
  delete env.RVS_EXPORT_DIR;
  if (exportDir !== undefined) env.RVS_EXPORT_DIR = exportDir;
  return spawnSync(process.execPath, [cli, ...args], { cwd: tmpdir(), env, encoding: "utf8" });
}

test("help identifies the installation and defaults exports inside it from any cwd", () => {
  const result = run(["help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(`Installation: ${root}`));
  assert.ok(result.stdout.includes(`Saved to ${join(root, "exports")}`));
});

test("an explicit absolute export directory overrides the installation default", () => {
  const exportDir = join(tmpdir(), "rvs-custom-exports");
  const result = run(["help"], exportDir);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(`Saved to ${exportDir}`));
});

test("relative export directories fail before starting an RV&S connection", () => {
  const result = run(["export", "--out", "report.md"], "relative-exports");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /RVS_EXPORT_DIR must be an absolute directory path/);
  assert.ok(!result.stderr.includes("server ready"));
});
