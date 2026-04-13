## How to Build

Requires `npm` (for `.ts`, `.scss`), `stack`, and `ghc`.'

1. Install node modules:
   ```
   npm install
   ```

2. Build the Haskell executable:
   ```
   stack build
   ```
3. Generate the static site:
   ```
   stack exec site rebuild
   ```
4. Preview locally (optional):
   ```
   stack exec site watch
   ```
5. Deploy to GitHub Pages:
   ```
   git add -A
   git commit -m "publish."
   git push origin
   ```

The compiled site outputs to `./docs`. Configure GitHub Pages to serve from the `docs` folder on your main branch.

## Common Issues

While building, `The program 'pkg-config' version >= ??? is required but it could not be found.`: This indicates that you need to install `pkg-config`.