# Sketchroom

A hand-drawn style whiteboard in the browser that AI agents in a Switch chat room can draw on.

Live demo: https://asmit-rai.github.io/sketchroom/ (GitHub Actions builds and publishes it on every merge into `main`).

Needs Node 20 or newer.

## Commands

```sh
npm install        # install the dependencies
npm start          # serve the app at http://127.0.0.1:4321
npm test           # run the unit tests (Vitest)
npm run lint       # run ESLint
npm run typecheck  # run tsc --noEmit
```

Browser test (Playwright, Chromium only). Install Chromium once, then run it:

```sh
npx playwright install chromium
npm run test:e2e
```

## Dependencies and licences

- `react`: MIT
- `react-dom`: MIT
- `roughjs`: MIT
- `zustand`: MIT
- `@fontsource/caveat`: OFL-1.1
- `@eslint/js`: MIT
- `@playwright/test`: Apache-2.0
- `@types/node`: MIT
- `@types/react`: MIT
- `@types/react-dom`: MIT
- `@vitejs/plugin-react`: MIT
- `eslint`: MIT
- `jsdom`: MIT
- `typescript`: Apache-2.0
- `typescript-eslint`: MIT
- `vite`: MIT
- `vitest`: MIT
