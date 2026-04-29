# platform/docs-site — Detailed Structure

Builds the public docs site from the markdown sources in `root/docs/`.

```
docs-site/
├── README.md
├── package.json                    @cfxdevkit/docs-site
├── tsconfig.json
├── vite.config.ts                  uses VitePress (Vite-native)
├── moon.yml
├── .vitepress/
│   ├── config.ts                   nav, sidebar, theme
│   ├── theme/
│   │   ├── index.ts
│   │   └── components/
│   └── plugins/
│       ├── adr-loader.ts           pulls docs/adr/*.md into a section
│       └── api-loader.ts           pulls docs/api/* (TypeDoc output)
├── public/                         static assets (logos, OG images)
└── content/                        symlink → ../../docs/  (build-time copy in CI)
```

### Build output

`dist/` is a fully static site. Deployable to any static host (object storage,
Cloudflare Pages, Netlify, plain nginx). No serverless runtime required.

### Why VitePress

Pure Vite. Zero framework lock-in. Same toolchain as the rest of the workspace.
