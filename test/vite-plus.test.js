// Under Vite+: `vp lint` and `vp exec` set VP_USER_AGENT for what they run, and the commands the
// lint, the command and the review page print then start with `vp exec`, as npm can refuse npx in a
// Vite+ app.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { cacheDir } from "../src/cache.js";
import { reviewCommand, runner, shrinkCommand } from "../src/text.js";
import { plugin, project } from "./helpers.js";

/** A script of this package run in `dir` as Vite+ 1.7.0 runs one, in a GitHub Actions step whose job summary is summary.md there. */
function underVp(dir, script, ...args) {
  const env = { ...process.env, VP_USER_AGENT: "vp/1.7.0", GITHUB_STEP_SUMMARY: join(dir, "summary.md") };
  return spawnSync(process.execPath, [join(plugin, script), ...args], { cwd: dir, encoding: "utf8", timeout: 300_000, env });
}

test("a printed command starts with vp exec only when Vite+ started the process", (t) => {
  assert.equal(runner({}), "npx oxlint-plugin-slimdeer");
  assert.equal(runner({ VP_USER_AGENT: "vp/1.7.0" }), "vp exec oxlint-plugin-slimdeer");
  assert.equal(runner({ VP_USER_AGENT: "" }), "npx oxlint-plugin-slimdeer");
  assert.equal(runner({ npm_config_user_agent: "pnpm/10.0.0 npm/? node/v24.0.0 darwin arm64" }), "npx oxlint-plugin-slimdeer");

  process.env.VP_USER_AGENT = "vp/1.7.0";
  t.after(() => delete process.env.VP_USER_AGENT);
  assert.equal(shrinkCommand(["public/hero.png"], 87, "linux").text, "vp exec oxlint-plugin-slimdeer public/hero.png --target 87");
  assert.deepEqual(reviewCommand([], { format: "webp" }, "win32"), { text: "vp exec oxlint-plugin-slimdeer --review --format webp", shell: "" });
  // a path PowerShell has to quote still runs node on the script itself, with no runner
  const quoted = shrinkCommand(["public/my hero.png"], undefined, "win32");
  assert.equal(quoted.shell, " in PowerShell");
  assert.match(quoted.text, /^& .+ 'public\/my hero\.png'$/);
});

test("a lint and the command run by Vite+ print commands that start with vp exec", () => {
  const files = { "src/App.jsx": 'export const a = <img src="/hero.png" />;\nexport const b = <img src="/photo.jpg" />;\n' };
  const dir = project({ files, images: ["public/hero.png", "public/photo.jpg"] });
  const none = underVp(dir, "bin/slimdeer.js", "--flagged");
  assert.equal(none.stderr, "oxlint-plugin-slimdeer: no list of flagged images here: lint in this folder first (vp lint, or eslint without --cache); if a lint here flagged no image, there is nothing to do\n");

  const lint = underVp(dir, "node_modules/oxlint/bin/oxlint", "--format", "unix");
  assert.equal(lint.status, 0, lint.stderr);
  assert.match(lint.stdout, /\. Run: vp exec oxlint-plugin-slimdeer public\/hero\.png \[Warning/);
  assert.match(lint.stderr, /, run: vp exec oxlint-plugin-slimdeer --review --flagged$/m);
  assert.match(lint.stderr, /, run: vp exec oxlint-plugin-slimdeer --flagged$/m);
  assert.doesNotMatch(lint.stdout + lint.stderr, /npx/);

  const check = underVp(dir, "bin/slimdeer.js", "--check");
  assert.equal(check.status, 1, check.stderr);
  assert.match(check.stdout, /, run: vp exec oxlint-plugin-slimdeer public\/hero\.png public\/photo\.jpg$/m);
  assert.doesNotMatch(check.stdout + check.stderr, /npx/);

  // the lint's job summary, then --check's
  const summary = readFileSync(join(dir, "summary.md"), "utf8");
  for (const command of ["--review --flagged", "--flagged", "--review", "public/hero.png public/photo.jpg"]) {
    assert.ok(summary.includes(`\n\`\`\`\nvp exec oxlint-plugin-slimdeer ${command}\n\`\`\`\n`), command);
  }
  assert.doesNotMatch(summary, /npx/);

  const mistake = underVp(dir, "bin/slimdeer.js", "--flagged", "--format", "webp");
  assert.equal(mistake.status, 2);
  assert.match(mistake.stderr, /review them first with vp exec oxlint-plugin-slimdeer --review --flagged --format webp, and run the command the page gives\nRun vp exec oxlint-plugin-slimdeer --help to see every option\.\n$/);

  const review = underVp(dir, "bin/slimdeer.js", "--review", "--flagged");
  assert.equal(review.status, 0, review.stderr);
  const page = readFileSync(join(cacheDir(dir), "review", "index.html"), "utf8");
  assert.ok(page.includes('"plain":"vp exec oxlint-plugin-slimdeer"'), "the page's commands start with vp exec");
  assert.doesNotMatch(page, /npx oxlint-plugin-slimdeer/);
});
