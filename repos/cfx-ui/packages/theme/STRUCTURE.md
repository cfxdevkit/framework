# @cfxdevkit/theme

## Root
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — Moonrepo workspace configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build configuration  
- `vitest.config.ts` — Vitest test configuration  

## `src/`
- `css/` — CSS theme files  
  - `base.css` — Base theme styles  
  - `dark.css` — Dark theme overrides  
- `index.test.ts` — Unit tests for core logic  
- `index.ts` — Main entry point (exports tokens, utilities)  
- `react.tsx` — React-specific theme hooks/components  
- `tailwind/` — Tailwind CSS theme integration (e.g., config, plugins)  
- `tokens.ts` — Design token definitions (colors, spacing, etc.)  

## `dist/`
- `css/` — Compiled CSS output  
- `index.js` / `index.d.ts` — Compiled JS and type declarations  
- `react.js` / `react.d.ts` — Compiled React exports  
- `tailwind/` — Compiled Tailwind integration assets  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  css
    base.css
    dark.css
  index.test.ts
  index.ts
  react.tsx
  tailwind
  tokens.ts
dist
  css
  index.js
  index.d.ts
  react.js
  react.d.ts
  tailwind
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 4ed517cde4fe69661df4c772a51973728f570d6ab4eed1b1778a6c5761f19430 -->
