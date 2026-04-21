## How to Build

Requires `node`/`npm` and `stack`/`ghc`.

1. Install dependencies + build haskell binary:
   ```bash
   npm run setup
   ```
2. Generate the static site:
   ```bash
   npm run rebuild
   ```
3. Preview locally (optional):
   ```bash
   npm run watch (-- --host {IP_ADDRESS})
   ```
4. Deploy to GitHub Pages:
   ```bash
   git add -A
   git commit -m "publish."
   git push origin
   ```

The compiled site outputs to `./docs`. Configure GitHub Pages to serve from the `docs` folder on your main branch.

## Common Issues

While building, `The program 'pkg-config' version >= ??? is required but it could not be found.`: This indicates that you need to install `pkg-config`.