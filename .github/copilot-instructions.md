<!-- .github/copilot-instructions.md -->
# Repository guidance for AI coding agents

This file contains concise, actionable information to help AI coding agents be productive in this repository.

**Big Picture**
- **Runtime & build**: This is a Bun-based React + TypeScript project. The runtime is Bun (see `package.json` scripts and `bunfig.toml`). Primary entrypoints are `src/index.ts` and `src/app/frontend.tsx`.
- **API surface**: API client code is generated from `federation_admin_openapi.yaml`/OpenAPI configs. Generated files live under `src/api/` (for example `src/api/apiSchemas.ts`, `src/api/apiResponses.ts`, `src/api/apiComponents.ts`). Do not hand-edit generated files.
- **UI structure**: UI primitives live in `src/components/ui/` (Radix-based components and shadcn style). Pages are under `src/pages/*` and app scaffolding is in `src/app/` (see `layout.tsx`, `App.tsx`).
- **State & data fetching**: Local/global state uses `src/hooks/store.ts` (Zustand). Server data fetching uses `@tanstack/react-query` (see usage in `src/apiContext.ts` and components under `src/pages/*`).
- **Authentication**: Simple interface-based auth system in `src/lib/auth.ts`. Current implementation is `DevAuth` for development. Route protection via `src/components/auth/RequireAuth.tsx`. React integration through `src/hooks/useAuth.ts`.

**Critical workflows / commands**
- Install deps: `bun install` (project generated with Bun).
- Dev (recommended): `bun --hot src/index.ts` (this branch removed the automatic API generator).
- Regenerate API client: The OpenAPI codegen is still the authoritative source, but this branch has retired the local generator script. To regenerate client code use the OpenAPI generator directly (see `openapi-codegen.config.ts`) or reintroduce a project-specific script.
- Build for production: `bun run build.ts` (see `build.ts` for build steps).

**Project-specific conventions & patterns**
- **Generated API is authoritative**: Anything under `src/api/` is produced by the OpenAPI codegen configured in `openapi-codegen.config.ts` / `openapitools.json`. When making API shape changes, update the OpenAPI YAML and re-run the generator; commit the generated diffs.
- **UI primitives vs pages**: Reusable UI pieces live in `src/components/ui/`. Higher-level components and pages compose those primitives (e.g., `components/app-sidebar.tsx`, `components/page-header.tsx`). Follow existing prop patterns in `ui/*` when adding new primitives.
- **i18n**: The project uses `i18next` and has `src/i18n.ts` — prefer translated strings when updating UIs.
- **State**: Small, local state inside components; cross-cutting or persisted UI state goes into `src/hooks/store.ts` (Zustand). Avoid adding a new global store unless justified.

- **Integration points & external dependencies**
- OpenAPI generator: `@openapi-codegen/cli` is used for generating the API client into `src/api/`. A previous helper script `scripts/generate-api-endpoints.ts` was used to produce an `src/config/api-endpoints.ts` registry; that helper is retired in this branch.
- Bun runtime: dev server uses Bun `--hot`; scripts rely on `bun` being installed and on `$PATH`.
- Tailwind / styling: Tailwind config is present; components use shadcn-like utility classes and `tailwind-merge` patterns (see `components/ui/*`).
- UI libs: Radix primitives (`@radix-ui/*`), `lucide-react` icons, `recharts` for charts.

**Files to reference when editing or adding features**
- `package.json` — start/dev/build scripts.
- `federation_admin_openapi.yaml` — canonical API contract.
- `openapi-codegen.config.ts` / `openapitools.json` — codegen configuration.
- `src/api/*` — generated API client (do not edit manually).
- `src/components/ui/*` — UI primitives to reuse.
- `src/hooks/store.ts` — global UI state patterns.
- `src/lib/auth.ts` — authentication interface and dev implementation.
- `src/hooks/useAuth.ts` — React auth integration.
- `src/components/auth/RequireAuth.tsx` — route protection.
- `src/app/layout.tsx`, `src/app/frontend.tsx`, `src/index.ts` — app bootstrap and routing.

**Examples / micro-rules**
- To add a new API-backed page:
  - Update or confirm the OpenAPI path in `federation_admin_openapi.yaml`.
  - Regenerate the client using the OpenAPI generator (see `openapi-codegen.config.ts` / `openapitools.json`) and commit the generated files under `src/api/`.
  - Use the generated fetchers in `src/api/apiFetcher.ts` and types from `src/api/apiSchemas.ts`.
  - Add a page under `src/pages/` and import UI primitives from `src/components/ui/`.
- To run the app during iterative API changes: run generator in watch mode (`--watch`) in one terminal and `bun --hot src/index.ts` in another so frontend hot-reloads on generated file updates.

If you need anything missing (CI commands, environment variables, or target ports), ask and I'll extract them and extend this guidance.

---
Please review and tell me which sections need more detail or examples. I can add CI notes, common debugging steps, or explicit code snippets on demand.
