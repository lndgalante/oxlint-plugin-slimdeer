# Showcase

These projects ran the rule or its command on their own images. Using them in a real project? We'd like to feature more cases in the README: what they caught, how much smaller the images became, and whether the result looked good enough to ship. [Share yours in an issue](https://github.com/lndgalante/oxlint-plugin-slimdeer/issues/new?template=showcase.yml); [the prompt below](#a-prompt-to-share) helps a coding assistant draft one.

## Kalia

[Kalia](https://kalia.app) builds and runs apps and websites for small and mid-size companies. Each client has its own server, where AI coding agents work on the client's repositories. This package is installed on every server, and the agents use it by themselves through a skill: they measure each image, choose the quality (the automatic one, or `--target 85` for product photos, covers and screenshots with text), shrink the images in place and add the lint rule with a CI check. Each run ends in a pull request that people review.

The numbers below are Kalia's own, from [its report of November 20, 2026](https://github.com/lndgalante/oxlint-plugin-slimdeer/issues/2). The client repositories are private, so the report names no client and shows no image, and this project hasn't measured any of it again.

Across all client repositories, counted from the merged pull requests and not measured again:

| | |
|---|---:|
| Repositories | 12 |
| Images shrunk | about 370 |
| Before | about 155 MB |
| After | about 74 MB |
| Saved | about 52% |

The images were shrunk in place, with the same names and formats, so no code changed. Some sites also switched flyers to WebP.

Kalia then measured four of the sites again, all built with Next.js and deployed on Vercel. For each it took up to three images that the site serves, measured the originals from the commit before the change with `--check`, and wrote previews with `-o`, with version 0.6.2 on a Linux machine:

| Site | Images | Quality | Original | Preview | Saved |
|---|---|---|---:|---:|---:|
| An education and marketing site | A cover photo, a flyer with text (as WebP), a partner logo | 85 | 1,583,023 bytes | 511,429 bytes | 67.7% |
| A consulting firm's site | Two Open Graph covers with text, an author avatar | Automatic | 330,742 bytes | 106,278 bytes | 67.9% |
| An industrial company's site | Two plant and product photos, an icon | 85 | 913,432 bytes | 613,863 bytes | 32.8% |
| A rental quoting app | Two product photos, a PDF logo | 85 and automatic | 649,757 bytes | 483,271 bytes | 25.6% |

- The pull requests had used 0.6.1. All 12 previews made with 0.6.2 were the files 0.6.1 had committed, byte for byte (same SHA-1).
- Vercel doesn't re-encode these files: on all four sites each URL returned the repository's bytes, with or without `Accept: image/avif,image/webp`, and with no `content-encoding` header. For the first three sites Kalia also measured the deployed site, so there the size saved in the repository is the size saved in transfer.
- The rental app's photos are also sent over WhatsApp, which may re-encode them. That wasn't measured.
- With the automatic quality, the product photos landed at 71 to 73 ("looks close"). Kalia raised them to 85, which saves less and looks the same side by side.
- One interior photo saved 10.4% at quality 85, just above the rule's 10% threshold.
- No image gave an error.

Kalia compared the images side by side at full size and saw no differences, including the text on flyers and covers. The rule stays on, with a CI check, in the client repositories that serve images, so new images arrive shrunk. One large app runs `--check` only on the images a pull request adds or changes.

On shared servers Kalia runs the command with low priority on 2 cores: measuring uses one engine per core, and with large photos Kalia saw one take about 1 GB of memory. A batch of about 30 photos at 1254×1254 takes about 4 minutes there.

## Multabot

[Multabot](https://multabot.com.ar) tracks traffic fines in Argentina. Its marketing site is built with Astro and deployed on Cloudflare Pages, and its repository is private. Multabot picked these three images, all served from `public/`:

| Image | Where it appears | Original | Compressed | Saved |
|---|---|---:|---:|---:|
| `public/opengraph.png`, 1200×630 PNG | The social preview of every page without its own | 370,801 bytes | 66,520 bytes | 82% |
| An annotated screenshot in `public/images/`, 1280×720 PNG | A guide page. It shows a partner's site, so it isn't shown here | 485,329 bytes | 190,091 bytes | 61% |
| `public/images/blog/multabot-flotas.jpg`, 1024×576 JPEG | The featured image of [a blog post](https://multabot.com.ar/blog/multabot-para-flotas) | 108,899 bytes | 60,161 bytes | 45% |
| **Total** | | **965,029 bytes** | **316,772 bytes** | **67%** |

The originals come from the commit before the project compressed its images. oxlint-plugin-pngdeer 0.5.0, this package's former name, measured them at quality 90 and wrote each compressed file:

```bash
npx oxlint-plugin-pngdeer@0.5.0 --check --target 90 \
  originals/opengraph.png \
  originals/<the screenshot>.png \
  originals/multabot-flotas.jpg
# exit 1 (savings found): 3 checked, 3 measured, 0 skipped, 0 errors

npx oxlint-plugin-pngdeer@0.5.0 originals/opengraph.png --target 90 -o previews/opengraph.preview.png
# and the same for the other two
```

Multabot shipped compressed files made with 0.4.0 at quality 90, and 0.5.0 makes the same bytes. The site doesn't use `astro:assets` or `<Image>`, and Cloudflare doesn't re-encode the files: on November 2, 2026, each URL returned the compressed PNG or JPEG byte for byte (same size and SHA-1), with no `content-encoding` or `cf-polished` header, even to a request that accepted AVIF and WebP. The originals weren't measured on the live site before the change, so the before-and-after transfer is not a measured result.

So far, Multabot has used the command line, not the lint rule.

Compare the originals and compressed files at full size in [docs/images/showcase/multabot](images/showcase/multabot), where `.optimized` marks each compressed one.

## A prompt to share

Send this to a maintainer, or paste it into your coding assistant from your project's folder. Review the report and previews before sharing them in an issue.

```text
Help me prepare a showcase case for oxlint-plugin-slimdeer in this project.

Inspect the project and choose up to three PNG/JPEG assets used by the app.
Run `npx oxlint-plugin-slimdeer --version`, then run
`npx oxlint-plugin-slimdeer@<that version> --check` with explicit paths to
those assets.
Keep original images, source files and linter configuration unchanged.
For images with useful savings, create separate previews in a temporary
directory using the same package version and quality target with `-o`.

Draft a short Markdown report with:
- Project name/link and where each image appears.
- Exact commands, package version and quality target.
- A table of original bytes, preview bytes, bytes saved and percent saved.
- Original and preview paths for me to compare at full size.
- Any errors or images with no useful savings.
- Whether an image optimizer or CDN already re-encodes these assets.
  Describe file-size savings as repository savings; claim browser-transfer
  savings only if you measured the deployed files too.

Use recorded results only. Leave visual approval, any visible tradeoffs and
whether I use or plan to keep the lint rule enabled for me to answer.
Ask how I want to be credited and which material may be featured publicly.
Return the report for my review without posting it or sending messages.
```
