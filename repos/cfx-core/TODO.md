# cfx-core TODO

## Structure Improvements

### 1. Add .gitignore Files
**Priority:** High  
**Status:** Pending

Add `.gitignore` files to each package to prevent build artifacts from being tracked:

```
# Add to each package: packages/{core,protocol,executor,devnode,testing}/.gitignore

# Build output
dist/
build/
*.tsbuildinfo

# Test
coverage/
.vitest/

# Dependencies
node_modules/

# Vite
.vite/

# Logs
*.log
pnpm-debug.log*
```

**Verification:** After adding, run `git status` to ensure build artifacts are ignored.

---

### 2. Tree-Shaking Optimization
**Priority:** Medium  
**Status:** Pending

Add the following to improve tree-shaking and reduce bundle sizes:

#### Package.json Updates
Add `sideEffects` field to each package's `package.json`:

```json
{
  "sideEffects": false
}
```

Or for packages with side effects:
```json
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}
```

#### Export Optimization
Ensure all subpath exports are properly defined:
- Verify each subpath export has both `types` and `import` conditions
- Add `require` condition for CommonJS support if needed
- Consider adding `default` condition for fallback

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

#### Bundle Size Verification
- Add bundle size checks to CI
- Use `size-limit` or `webpack-bundle-analyzer` to track changes
- Document expected bundle sizes for each entry point

---

### 3. Build Output Cleanup
**Priority:** Medium  
**Status:** Pending

Ensure clean builds work from scratch:

#### Verification Steps
1. Add `prepublishOnly` script to clean dist before publish:
   ```json
   "scripts": {
     "prepublishOnly": "pnpm clean",
     "clean": "rm -rf dist .vitest coverage"
   }
   ```

2. Verify `.npmignore` or `files` field excludes unwanted artifacts:
   ```
   # .npmignore (if not using files field)
   node_modules/
   .vitest/
   coverage/
   *.test.ts
   src/
   *.md
   !README.md
   ```

3. Test clean build:
   ```bash
   rm -rf dist node_modules
   pnpm install
   pnpm build
   ```

4. Add to CI pipeline to verify clean builds

---

### 4. TypeScript Configuration
**Priority:** Medium  
**Status:** Pending

Improve TypeScript configuration for better type safety and inter-package imports:

#### Path Mappings
Add path mappings in root `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@cfxdevkit/core": ["./repos/cfx-core/packages/core/src/index.ts"],
      "@cfxdevkit/core/*": ["./repos/cfx-core/packages/core/src/*"],
      "@cfxdevkit/protocol": ["./repos/cfx-core/packages/protocol/src/index.ts"],
      "@cfxdevkit/protocol/*": ["./repos/cfx-core/packages/protocol/src/*"],
      "@cfxdevkit/executor": ["./repos/cfx-core/packages/executor/src/index.ts"],
      "@cfxdevkit/devnode": ["./repos/cfx-core/packages/devnode/src/index.ts"],
      "@cfxdevkit/testing": ["./repos/cfx-core/packages/testing/src/index.ts"]
    }
  }
}
```

#### Type Completeness Verification
- Add script to check for missing type definitions
- Ensure all public exports have explicit type annotations
- Verify `emitDeclarationOnly: true` produces complete `.d.ts` files

#### Strict Mode
Enable strict TypeScript options:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

### 5. Documentation Improvements
**Priority:** Low  
**Status:** Pending

- Expand `executor` README (currently 374 bytes)
- Add PORTING.md to packages that lack it
- Expand `protocol` STRUCTURE.md (currently 829 bytes)

---

### 6. Workspace Template Validation
**Priority:** Low  
**Status:** Pending

- Add script to validate `.template.yaml` matches actual package structure
- Run validation in CI before releases

---

### 7. Dependency Validation
**Priority:** Low  
**Status:** Pending

- Add script to verify cross-package dependencies are explicit
- Run `knip` in CI to detect unused dependencies
- Document dependency graph between packages

---

## Recent Changes

### 2026-05-19
- Removed `cfx-openhands/` directory (was empty, only contained `.venv/` and `artifacts/`)
