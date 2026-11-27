<p align="center">
  <img src="https://raw.githubusercontent.com/lndgalante/oxlint-plugin-slimdeer/main/.github/logo.svg" alt="" width="80" height="80">
</p>

<h1 align="center">oxlint-plugin-slimdeer</h1>

<p align="center"><strong>Catch heavy PNGs and JPEGs on the line of code that uses them.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/oxlint-plugin-slimdeer"><img src="https://img.shields.io/npm/v/oxlint-plugin-slimdeer" alt="npm version"></a>
  <a href="https://github.com/lndgalante/oxlint-plugin-slimdeer/actions/workflows/ci.yml"><img src="https://github.com/lndgalante/oxlint-plugin-slimdeer/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
</p>

An image lint rule for [oxlint](https://oxc.rs/docs/guide/usage/linter) and ESLint. It measures your project's PNGs and JPEGs on your machine with [slimdeer](https://github.com/heydeer/slimdeer), HeyDeer's open-source lossy compressor, and warns where your JS or TS code uses one that could be at least 4 KiB and 10% smaller at about the same visual quality. It only reports: it uploads nothing and changes no image, and a separate command shrinks the ones you choose. This plugin isn't made by HeyDeer; it runs their MIT-licensed engine.

## Try it on your images

```bash
npx oxlint-plugin-slimdeer --review --open
```

No setup: run it from your project's folder. It changes no image: it opens a page that shows each one that could be smaller, before and after, or says that none could. Working through a coding agent? There is a prompt to paste below.

![The command's review page in a browser: public/hero.png, an arcade stick, split by a divider into before (509 kB) and after (151 kB), with "Quality 87/100: looks the same side by side" and Fit, 100% and 200% buttons. The bar at the bottom says "5 of 5 images ticked: could save 723 kB (1.0 MB → 317 kB, 70% smaller)" above the command that shrinks them and a Copy button](https://raw.githubusercontent.com/lndgalante/oxlint-plugin-slimdeer/main/docs/images/review.png)

`npx oxlint-plugin-slimdeer --check` prints the same list in the terminal ([more](#check-without-a-linter)). On this repository's example app (shortened):

```
…
public/photo.jpg: could be 64% smaller (235 kB → 85 kB, quality 76/100: looks close, with differences you might spot side by side)
src/assets/diagram.png: could be 75% smaller (248 kB → 63 kB, quality 90/100: looks identical)
public/hero.png: could be 70% smaller (509 kB → 151 kB, quality 87/100: looks the same side by side)
slimdeer: 5 images could be 723 kB smaller (1.0 MB → 317 kB, 70% smaller). Images unchanged.
```

The score is [SSIMULACRA2](https://github.com/cloudinary/ssimulacra2), a perceptual metric out of 100; the words after it are how the tool reads it. JPEG photos often land in the 70s, like `photo.jpg` here: look at those first, or review them alone at a higher target, as in `--review public/photo.jpg --target 90`.

- **Where it pays:** images served as committed (plain `<img>`, CSS backgrounds, share images, `public/` in Vite and Astro). Behind `next/image`, Astro's `<Image>` or an image CDN, shrinking mostly saves repository and build size and adds a second lossy pass: leave those folders out with [`exclude`](#options).
- **Using ESLint?** ESLint 9 and 10 run the same rule, without oxlint ([quick start](#quick-start-with-eslint)).
- **Shrinking is lossy, so commit first.** File names and formats stay the same, so no code changes.
- **On the page**, untick any image to keep as it is, then run the command it gives. Each "after" is the file that command writes, byte for byte.
- **The first run** takes a few seconds per image (a full-size camera photo can take a minute or two), and later runs read the cache. In a big project, start with one folder, like `--review public`. The cache and the page go in `node_modules/.cache/slimdeer`. It needs Node 20.19+ or 22.12+.
- **WebP or AVIF?** The command also writes copies in those formats, compared at the same quality scores ([WebP and AVIF](#webp-and-avif)).

**Working through a coding agent?** Paste this, or install [the skill](#for-coding-agents), which also sets up the lint rule:

```text
Check this project's images with oxlint-plugin-slimdeer (lossy, runs on this machine,
uploads nothing). Change no image.
1. Run `npx --yes oxlint-plugin-slimdeer --check --json`. It can take a few seconds per
   image. Exit code 1 means it lists images, not that it failed.
2. Tell me the total and the biggest savings (up to 10): path, size now and after,
   quality score. Point out any that score below 80.
3. Run `npx --yes oxlint-plugin-slimdeer --review`, give me the address it prints, if any,
   and stop.
```

**In use:** [Kalia](https://kalia.app) reports about 370 images shrunk across 12 client repositories, from about 155 MB to about 74 MB by its own count, with product photos raised to `--target 85` ([showcase](#showcase)). Savings vary by image: on pinned copies of public repositories, `--check` flagged all 19 of the Vue docs' guide images (74% smaller in all, each scoring 89 or more) but only 2 of Starlight's 12 small portraits (7% smaller in all), in repository bytes ([the trials](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/bench/TRIALS.md)).

## Why a lint rule

Compressing your images once fixes today's. The rule also catches next month's 2 MB screenshot, whether you, a teammate or a coding agent adds it: in the pull request, with the lint in CI ([see one](https://github.com/lndgalante/slimdeer-demo/pull/1/files)), and in your editor:

![VS Code with the Oxc extension: "/hero.png" in App.jsx is underlined, and the hover says hero.png could be 70% smaller (509 kB → 151 kB) and gives the command that shrinks it](https://raw.githubusercontent.com/lndgalante/oxlint-plugin-slimdeer/main/docs/images/editor.png)

Vite copies `public/` to the build as it is, and Astro never optimizes images there. The usual fixes run at other moments:

| | When it runs | The committed file |
|---|---|---|
| **Build plugins** like vite-plugin-image-optimizer | during each build, lossless by default | stays heavy |
| **calibreapp/image-actions** | on pull requests, with write access; forks need extra setup | recompressed on the branch |
| **Imgbot** | in pull requests it opens, lossless by default | recompressed |
| **TinyPNG** | when someone uploads the images; its API needs a key | recompressed |
| **Lighthouse** | on a running page, estimating savings from bytes per pixel | unchanged |
| **This rule** | in your editor, lint and CI, on the line that names the image | unchanged until you run the command it gives |

## Quick start with oxlint

Needs Node 20.19+ or 22.12+ and oxlint 1.60+. oxlint's JS plugins are alpha, so pin oxlint's version:

```bash
npm install --save-dev --save-exact oxlint
npm install --save-dev oxlint-plugin-slimdeer
```

No `.oxlintrc.json` yet? Create it next to `package.json`:

```json
{
  "jsPlugins": ["oxlint-plugin-slimdeer"],
  "rules": { "slimdeer/compressible-image": "warn" }
}
```

Already have one? Vite's React templates and `npx oxlint --init` create it. Add the package under `jsPlugins`, not `plugins`, and put the rule inside the `rules` the file already has: of two `rules` keys, the last one silently wins. In a new Vite React app (the JavaScript template; the TypeScript one also lists `"typescript"` in `plugins`), the file becomes:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "oxc"],
  "jsPlugins": ["oxlint-plugin-slimdeer"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }],
    "slimdeer/compressible-image": "warn"
  }
}
```

Then run `npx oxlint`. It warns on each heavy image, then sums them up. A new app may show no warning, and that can be right: the image in Vite's template would save less than 4 KiB, so it isn't flagged, and `npx oxlint-plugin-slimdeer --check` says how many images it checked. To run without oxlint's own default rules, set `"categories": { "correctness": "off" }` in the file (change the key if the file already has one): only the rules the file names then run.

## Quick start with ESLint

If your project already lints with ESLint 9 or 10, ESLint runs the same rule and shares oxlint's cache. Needs Node 20.19+ or 22.12+ (22.13+ for ESLint 10).

```bash
npm install --save-dev oxlint-plugin-slimdeer
```

Add the recommended config. It turns the rule on for the files the rest of your config lints:

```js
// eslint.config.js
import slimdeer from "oxlint-plugin-slimdeer";

export default [
  // ...your config, which parses your JSX or TypeScript
  slimdeer.configs.recommended,
];
```

No config for your JSX yet? ESLint then lints no `.jsx` file, and the rule warns on nothing. Put this object before `slimdeer.configs.recommended`:

```js
  { files: ["**/*.{js,jsx}"], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
```

For TypeScript, [add a config object with its parser](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#eslint-setup).

Then run `npx eslint .`, without `--cache`: ESLint would replay old warnings for images you already shrank, and the rule would print no summary.

## Quick start with Vite+

Vite+ brings its own oxlint, so install only the plugin: `vp install -D oxlint-plugin-slimdeer`. `vp lint`, and editors that start `vp lint --lsp`, read the `lint` block of `vite.config.ts`, not `.oxlintrc.json`:

```ts
// vite.config.ts
import { defineConfig } from "vite-plus";

export default defineConfig({
  // ...your config
  lint: {
    jsPlugins: ["oxlint-plugin-slimdeer"],
    rules: { "slimdeer/compressible-image": "warn" },
  },
});
```

Then run `vp lint`. A new Vite+ app pins its package manager, so `npm` and `npx` can refuse to run in it (`EBADDEVENGINES`). So when Vite+ runs the lint or the command, the commands they print start with `vp exec` in place of `npx`, as in `vp exec oxlint-plugin-slimdeer --review --flagged`. Run the `npx oxlint-plugin-slimdeer` commands on this page the same way.

## What a lint shows

Each warning ends with the command that shrinks its image. After the warnings, the rule sums them up, each image once, biggest saving first (here in `example/`, shortened):

```
slimdeer: 4 flagged images could be 718 kB smaller in all (1.0 MB → 310 kB, 70% smaller):
  image                           now    after   saves  quality
  public/hero.png              509 kB → 151 kB  359 kB       87
  src/assets/diagram.png       248 kB →  63 kB  185 kB       90
  public/photo.jpg             235 kB →  85 kB  150 kB       76
  src/assets/crystal-ball.png   35 kB →  11 kB   24 kB       87
…
slimdeer: to see the 4 flagged images before and after on one page first, run: npx oxlint-plugin-slimdeer --review --flagged
slimdeer: to shrink the 4 flagged images in place (lossy, so commit first), run: npx oxlint-plugin-slimdeer --flagged
```

`--review --flagged` writes the review page for exactly the images the lint flagged, each at the target the lint measured it at, so images the rule's `exclude` option or a disable comment leaves out stay out. `--flagged` shrinks them in place. Both leave out, and name, an image whose bytes changed since the lint; lint again to check it. With one flagged image, the summary offers a preview as a new file instead, like `npx oxlint-plugin-slimdeer public/photo.jpg -o photo.preview.jpg`. The summary also lists images no linted code names, like a background in a CSS file, with where each one is named.

The shrink command marks what it writes, so the rule doesn't flag it again, and keeps each file's name and format, so no code changes. Each lossy pass costs quality, so shrink an image once. An image another tool already compressed can still be flagged: look at it on the review page first. The lint keeps warning on an image you decide to keep until you add it to the rule's [`exclude` option](#options).

No warnings at all? [Go through this list](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#no-warnings).

## Check without a linter

`--check` measures without changing any image and needs no linter setup. It checks every package below the folder, warms the lint's cache, and ends with the commands that review and shrink what it lists. It reads no linter configuration, and neither does plain `--review`: pass the rule's options, like its `exclude` as `--exclude`. It exits 0 when no image clears both thresholds, 1 when one does, and 2 on a mistake in the arguments or when an image or folder couldn't be checked, so a CI step can gate on it. `--json` prints one JSON document on stdout instead, for scripts. With `--format webp` or `--format avif`, it compares each image's WebP or AVIF copy with its shrink at the same quality score instead, and leaves out each image whose copy is already next to it ([WebP and AVIF](#webp-and-avif)). [Options, exit codes and the JSON](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#check-images-without-changing-them)

## WebP and AVIF

The command can also write a WebP or AVIF copy of an image, at the quality score its PNG or JPEG shrink would have, so the two sizes compare like for like:

```bash
npx oxlint-plugin-slimdeer --check --format webp           # which images are worth it
npx oxlint-plugin-slimdeer --review --format webp          # see them before and after
npx oxlint-plugin-slimdeer --format webp public/hero.png   # write public/hero.webp
npx oxlint-plugin-slimdeer public/photo.jpg -o photo.avif  # write the copy you name
```

Run in `example/`, the third command prints:

```
public/hero.png → public/hero.webp: 509 kB → 92 kB (82% smaller, quality 87/100: looks the same side by side); shrunk as PNG at the same quality: 151 kB
slimdeer: public/hero.png is still there, and this line still names it; point it at hero.webp:
  src/App.jsx:10  <img src="/hero.png" alt="An arcade stick" />
  and 1 mention in Markdown: SOURCES.md:10
slimdeer: delete public/hero.png only once nothing uses it; other sites, emails and share previews may link to files in public/.
```

On this repository's example app, at the same quality scores: as WebP, three of the five images come out 32% smaller than shrinking them as PNG (793 kB now, 225 kB shrunk, 152 kB as WebP), while the photo comes out only 3% smaller than its JPEG shrink, so `--check --format webp` leaves it out. As AVIF, three come out 64% smaller than shrinking them (780 kB now, 247 kB shrunk, 89 kB as AVIF), but the diagram comes out 59% bigger than its PNG shrink, so it is left out. It depends on the image, so check before you convert.

- The original stays as it is, and `--format` writes only new files. The saving starts once your code names the copy: the command lists the lines that still name the original.
- If `poster.png` and `poster.jpg` both qualify for `poster.webp` in the same folder, check and review report both paths and exit 2. You can review either original by path. To keep both copies, give one a different filename with `-o`.
- `--format` writes a copy only where it is smaller than both the original and the original's PNG or JPEG shrink; `-o` writes one whenever it is smaller than the original, and says when the shrink would be smaller. By default, `--check --format` and `--review --format` list a copy only when it is at least 4 KiB and 10% smaller than the shrink.
- Skip it where something already converts: next/image, Astro's `<Image>` and `<Picture>`, Gatsby's image plugin and many image CDNs serve WebP to browsers that take it, and converting the source first adds a second lossy pass. The command says so when your package.json depends on next, astro, gatsby, @nuxt/image or vite-imagetools.
- Keep share images, app icons and images in email as PNG or JPEG; as AVIF, they can fail to show. In a [December 2024 test](https://joost.blog/use-avif-webp-share-images/), link previews on X, LinkedIn, Slack and iMessage didn't show AVIF (WebP showed on all 11 platforms tried), and [Outlook for Windows](https://www.caniemail.com/features/image-avif/) doesn't show AVIF either. With `--format avif`, the command points out each image named like a share image or an icon.
- AVIF is slow: on the example app, `--check --format avif` took 66 seconds for five images, against 13 as WebP and 5 for the PNG and JPEG check, and one image alone often takes about a minute. `--check --format` and `--review --format` cache what they measure.
- A copy keeps transparency and the color profile, and drops other metadata; a JPEG's EXIF orientation is applied to its pixels. [WebP](https://caniuse.com/webp) and [AVIF](https://caniuse.com/avif) each show in about 97% of browsers in use (caniuse, November 2026); AVIF needs Safari 16.4 or later to show on every Mac.

[Every option, the JSON, and each reason an image is left out](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#write-images-as-webp-or-avif)

## For coding agents

An agent adds images too, and the rule warns on them in the agent's own lint run. [The agent skill](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/skills/oxlint-plugin-slimdeer/SKILL.md) in this repository has a coding agent measure your images with `--check --json`, give you the review page's address, shrink only the images you approve, and, when you ask, write WebP or AVIF copies and list the code that still names the originals:

```bash
npx skills add lndgalante/oxlint-plugin-slimdeer
```

Without it, paste [the prompt above](#try-it-on-your-images), or ask the agent to run `npx oxlint-plugin-slimdeer --review` (after a lint, `--review --flagged`) and give you the page's address: without `--open`, it opens nothing and prints the address. The page's command shrinks only the images you keep ticked; run it, or paste it back to the agent.

## What gets flagged

The rule reads imports, `require`, `new URL(…, import.meta.url)`, JSX `src` and `srcSet`, CSS `url()` in inline styles and CSS-in-JS templates, and strings that start with `./`, `../`, `/` or an alias like `@/`, in JS and TS and in the script parts of Vue, Svelte and Astro files. In React Native and Expo projects, `@2x` and platform variants count with the image they belong to. Images named only from CSS files, HTML or Markdown get no warning, but the summary lists them, and `--check` and `--review` include them. An image is flagged when it could be at least 4 KiB and 10% smaller.

By default, the rule picks a quality for each image, about what TinyPNG would give it, and never below 70: below that, it calls a result "visibly different". An image it can't make smaller at 70 or above isn't flagged, and the shrink command leaves it as it is. The lint says how many it turned down as it measures, and `--check` names them:

```
slimdeer: 1 image can't be made smaller without a visible difference (its best quality is below 70), so it isn't listed; to try it at a lower target, run: npx oxlint-plugin-slimdeer --check public/fade.png --target 60
```

Above the floor, a score in the 70s still means "close, with differences you might spot side by side", like `photo.jpg` above: look at those on the review page before you shrink them. [What it flags, and what it skips](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#what-it-flags)

## Editors

Warnings show in editors that run your project's oxlint as a language server: the [Oxc extension](https://github.com/oxc-project/oxc-vscode) for VS Code and its forks, Zed's Oxc extension (when `package.json` lists `oxlint` or `vite-plus`), and Neovim's `oxlint` config. With ESLint, ESLint's own editor extensions run the rule.

By default, the editor never waits for the rule, which measures images in the background. A file shows its warnings the next time the editor lints it, usually when you type in it. Lint once from the command line first, or commit the cache (see CI below), and the warnings are there when you open a file.

## CI

Lint each pull request, with annotations on the lines that name heavy images:

```yaml
# .github/workflows/images.yml
name: Images
on: pull_request
permissions:
  contents: read
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
      - run: npm ci
      - run: npx oxlint --format github
```

A pull request that adds a heavy image then gets a warning on the line that uses it ([see it live](https://github.com/lndgalante/slimdeer-demo/pull/1/files)):

![A GitHub pull request's Files changed tab: under the added line that uses /hero.png, a check warning from slimdeer(compressible-image) says hero.png could be 70% smaller (509 kB → 151 kB) and gives the command that shrinks it](https://raw.githubusercontent.com/lndgalante/oxlint-plugin-slimdeer/main/docs/images/pull-request.png)

With ESLint, run `npx eslint .`: `actions/setup-node` turns its output into annotations. With Vite+, run `vp lint --format github`. GitHub annotates at most 10 warnings and 10 errors per step, your other lint warnings included. The rule also writes the job summary, with no option or permission: a table of the flagged images (up to 200) and the commands that review and shrink them.

### Commit the cache

Without it, CI measures every image on every run, two at a time on a 2-core runner (GitHub's default for private repositories).

1. Name a folder in `settings`: next to `rules` in `.oxlintrc.json`, in a config object in ESLint, or in the `lint` block of `vite.config.ts`.
   ```json
   "settings": { "slimdeer": { "cacheDir": ".slimdeer" } }
   ```
2. Fill it. This copies what your machine has measured and measures the rest; from a monorepo's root, it fills each package's folder. If the rule sets a `target`, pass the same `--target`. It exits 1 when it lists images that could be smaller: a finding, not a failure.
   ```bash
   npx oxlint-plugin-slimdeer --check --cache-dir .slimdeer
   ```
3. Commit the folder, and again after adding or changing images. To clear old entries, or to cache in GitHub Actions instead, see [the cache](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#the-cache).

### Block only new heavy images

Set the rule to `"error"` to fail the check. To let through the heavy images you already have, list them in the rule's `exclude` option: from the next lint on, they are no longer measured or reported, and `--flagged` leaves them alone (it shrinks what the last lint flagged). ESLint 9.24+ can also [suppress them](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#turning-it-off).

## Options

Pass options after the severity, like `["warn", { "exclude": ["public/originals", "**/fixtures/**"] }]`:

- `exclude` (default `[]`) leaves out paths or patterns, relative to the project's folder.
- `target` (`"auto"`) is the quality to keep: `"auto"`, or a SSIMULACRA2 score, where 90 looks identical and 80 the same side by side.
- `minSavedBytes` (`4096`) and `minSavedPercent` (`10`) set the smallest saving worth a warning. An image must clear both.
- `scan` (`"project"`): `"referenced"` measures only the images the linted files name, for linting a few files. [Compare them](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/bench/README.md#comparing-scan-scopes).

With ESLint's recommended config, set the rule again in a config object after it. [All options](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#options)

## Questions

- **Does it upload my images?** No. The engine ships in the package as 5.3 MB of WebAssembly (the package is a 2.0 MB download): no upload, no API key, no dependencies, no native binaries, no install scripts.
- **Is it lossless?** No. SSIMULACRA2 scores how close an image looks to its original, from 0 to 100, and each warning shows it. By default, slimdeer keeps the smallest file that scores about as high as TinyPNG's file would. In slimdeer's own benchmark of 180 PNGs (published under its former name, pngdeer), the median file is 8–12% smaller than TinyPNG's at the same quality ([leaderboard](https://github.com/heydeer/slimdeer/blob/a8e88267ba02cbaf66e746db93ed04242dca8450/README.md#leaderboard)). For photos and screenshots with small text, try `"target": 90` and compare.
- **Does it resize images?** No. Each image keeps its width and height; only the file gets smaller.
- **How is it different from TinyPNG or Squoosh?** Both compress the images you hand them. TinyPNG uploads each one, and its API needs a key, with 500 free compressions a month. Squoosh runs in your browser, one image at a time, at the settings you pick. This plugin runs slimdeer on your machine, picks the quality per image, and finds the images that need it in your code.
- **Does it help behind `next/image`, Astro's `<Image>` or an image CDN?** Less: they re-encode images for visitors anyway, so shrinking those mostly saves repository and build size, and adds a second lossy pass. Behind `next/image`, the warning says so. Leave those folders out with `exclude`. Images served as they are still count: plain `<img>`, CSS backgrounds, and `public/` in Vite and Astro. [When not to use it](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#when-not-to-use-it)
- **Does the rule suggest WebP or AVIF?** No: its fix keeps each image's name and format, so no code changes. The command writes WebP and AVIF copies when you ask ([WebP and AVIF](#webp-and-avif)). Images that are already WebP, AVIF, GIF or SVG aren't measured.
- **How slow is the first run?** The first lint measures every PNG and JPEG in the project, one engine per core (8 at most); later lints read the cache. On a 16-core M3 Max, the first lint of an app with 39 images (12 MB) took 14.6 s and peaked at 3.0 GB of memory. Later lints took 178 ms, against 68 ms without the plugin. That was version 0.3.0; today's engine writes the same PNG and JPEG files in about the same time ([the benchmark](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/bench/README.md)). Since 0.6.0, an image whose automatic result scores below 70 is compressed a second time, at 70: on tanstack.com's 148 images, a cold run took 718 s of CPU time, against 661 s with 0.5.0, in the same wall time ([the quality floor](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/releases/0.6.0.md#the-quality-floor)).
- **Does it need oxlint?** No. `--check`, `--review` and the shrink command run alone, and ESLint 9 and 10 run the same rule.
- **Where doesn't it work?** oxlint runs JS plugins only on 64-bit little-endian machines, and on some memory-constrained Linux machines any JS plugin can make oxlint run out of memory ([oxc#20331](https://github.com/oxc-project/oxc/issues/20331)). slimdeer fails on some images, like flat-color JPEGs, and the rule skips others, like grayscale PNGs with a color profile; a command-line lint names them on stderr. [What it skips](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#what-it-skips)

## Learn more

[The rule's docs](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md) cover every option and setting, `--check`, `--review`, WebP and AVIF copies, paths and aliases, the cache, and upgrading. Also: [CHANGELOG.md](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/CHANGELOG.md), [FINDINGS.md](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/FINDINGS.md) (design notes) and [CONTRIBUTING.md](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/CONTRIBUTING.md).

This plugin is a separate project from slimdeer. Report problems with the rule or the command in [this repository's issues](https://github.com/lndgalante/oxlint-plugin-slimdeer/issues). An error that says "a bug in HeyDeer's slimdeer engine" goes to [slimdeer's issues](https://github.com/heydeer/slimdeer/issues).

This package was formerly named oxlint-plugin-pngdeer, until 0.5.0. [Moving to the new name](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/rules/compressible-image.md#moving-from-oxlint-plugin-pngdeer) takes a few edits.

## Showcase

[Kalia](https://kalia.app) builds and runs apps and websites for small and mid-size companies. Its coding agents run this package by themselves through a skill: they measure each image, shrink it in place and add the lint rule with a CI check, and each run ends in a pull request that people review. Kalia reports about 370 images shrunk across 12 client repositories, from about 155 MB to about 74 MB (about 52% smaller), counted from the merged pull requests. On four of those sites it measured up to three images again with 0.6.2: from 26% to 68% smaller per site. Vercel serves those files as they are, and on three of the sites Kalia measured the same saving on the deployed site. With the automatic quality, product photos landed at 71 to 73, so Kalia raised them to `--target 85`, which saves less and looks the same side by side. The client repositories are private, so no images are shown. [The full report](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/showcase.md#kalia)

[Multabot](https://multabot.com.ar) tracks traffic fines in Argentina. It ran this package's command (version 0.5.0, formerly named oxlint-plugin-pngdeer) on three images that its Astro site, on Cloudflare Pages, serves from `public/` as they are. At `--target 90`, the quality suggested above for photos and screenshots with small text, they became 67% smaller in all (965 kB → 317 kB). Multabot shipped the compressed files: on November 2, 2026, the site served each one byte for byte. Two are below. The third, an annotated screenshot of a partner's site, went from 485,329 to 190,091 bytes (61% smaller). [The full report](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/showcase.md#multabot)

| Original | Compressed at quality 90 |
|---|---|
| ![Multabot's social preview: the headline "Las multas de tu flota, en un solo tablero." beside a glowing dotted map of Argentina and a list of speeding fines](https://raw.githubusercontent.com/lndgalante/oxlint-plugin-slimdeer/main/docs/images/showcase/multabot/opengraph.png)<br>Social preview · 370,801 bytes | ![Compressed social preview with the same headline, map and list of fines](https://raw.githubusercontent.com/lndgalante/oxlint-plugin-slimdeer/main/docs/images/showcase/multabot/opengraph.optimized.png)<br>66,520 bytes · 82% smaller |
| ![Photo of a man smiling at a laptop that shows a fleet dashboard, with trucks outside the window](https://raw.githubusercontent.com/lndgalante/oxlint-plugin-slimdeer/main/docs/images/showcase/multabot/flotas.jpg)<br>Blog photo · 108,899 bytes | ![Compressed photo of the same man, laptop and trucks](https://raw.githubusercontent.com/lndgalante/oxlint-plugin-slimdeer/main/docs/images/showcase/multabot/flotas.optimized.jpg)<br>60,161 bytes · 45% smaller |

Using the rule or the command in a real project? We'd like to feature more. [Share yours in an issue](https://github.com/lndgalante/oxlint-plugin-slimdeer/issues/new?template=showcase.yml): what it caught, how much smaller the images became, and whether the result looked good enough to ship. [A prompt](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/docs/showcase.md#a-prompt-to-share) helps a coding assistant draft one.

## License

[MIT](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/LICENSE). The engine's dependencies keep their own licenses ([engine/THIRD_PARTY_LICENSES.txt](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/engine/THIRD_PARTY_LICENSES.txt)), and [engine/README.md](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/engine/README.md) says where the engine comes from. The example images keep theirs ([example/SOURCES.md](https://github.com/lndgalante/oxlint-plugin-slimdeer/blob/main/example/SOURCES.md)), and the MIT license doesn't cover the showcase images. JPEG output is encoded with mozjpeg: this software is based in part on the work of the Independent JPEG Group. AVIF output is encoded with libaom, under the BSD-2-Clause license and the Alliance for Open Media Patent License 1.0, with parts of it under BSD-3-Clause and MIT.
