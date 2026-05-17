# Showcase Local Architecture

`showcase-local` is a panel-driven workspace for exercising the embedded `@cfxdevkit/devnode-server` through `ConfluxDevkitClient`.

The canonical integration point is `ShowcaseWorkspacePanelsProps` in `app/panels/shared.tsx`. `app/showcase-workspace.tsx` owns workspace state, `app/workspace/*` hooks own effects and actions, and `app/shell/stage.tsx` passes the assembled state/actions into `ShowcaseWorkspacePanels`. Individual panels should render from those props and call the supplied actions instead of creating their own `ConfluxDevkitClient`, polling loops, or server-action orchestration.

Panel registration is declarative through `app/panels/registry.ts`. The registry includes the accounts and secret reveal panels, while `app/panels/index.tsx` maps panel ids to the component that consumes the shared props.

`lib/showcase-guide.ts` is intentionally limited to code snippets shown inside live panels. It is not a tutorial flow or navigation model; workspace ordering and visibility belong to the shell and panel registry.

The client helper surface in `app/keystore/client.ts` is intentionally narrow: it exposes `fetchDevnodeAccounts()` for runtime account refresh and `revealSecret()` for the two-step secret reveal protocol used by the reveal panel. Keystore lifecycle and wallet operations flow through the shared runtime hooks instead.