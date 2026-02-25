# osu! Collab Tools

A simple online toolbox that makes it easier to create collab images.

## Features

Currently only part of them are available:

- [x] ImageMap Editor (Mostly stable, new features on the way)
- [x] Avatar Image Generator (Beta, new features on the way)
- [ ] Simple Collab Generator (Planning)
- [ ] External tools collection
- [ ] *More ideas to come up with*

You can request more features by submitting an issue.

## Build and Deployment

![Build Status on Netlify](https://api.netlify.com/api/v1/badges/e9267089-3b2b-4cd8-b9e9-6bddf234fb43/deploy-status)

There is a live deployment by GitHub Pages [here](
https://clonewith.github.io/osu-collab-tools/), where You can always use the **latest** features!

If network conditions don't allow for access, you can try the following sites:

- [Netlify](https://amaz1ng-c0llab-cw.netlify.app/) (Will not always be up to date with latest changes)

### Run Locally

You need to clone this repository first. After that, turn to the repository directory and install dependencies:

```bash
pnpm install
```

Then start the Next.js server:

```bash
next dev
```

Here's an alternative if the command above doesn't work:

```bash
pnpm dev
```

The website should be available shortly at the specified address given in the console output.
