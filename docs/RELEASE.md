# Release Checklist

Use this checklist before merging a generated Changesets release PR or publishing packages.

## Versioning

- Keep Yable pre-1.0 until the public API, docs, demos, and package smoke tests are stable enough for a compatibility promise.
- Do not use a Changesets fixed group for all packages during pre-1.0 development. A fixed group can turn one package's minor change into a synchronized `1.0.0` release for every package.
- Bump only the packages with public user-facing changes. Let `updateInternalDependencies: "patch"` handle dependent package patch bumps.
- Confirm `apps/docs` stays ignored by Changesets and uses workspace packages inside this monorepo.

## Pre-Merge Gates

- Run targeted tests for changed behavior.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm size` when package or release mechanics changed.
- Run package integrity checks or `pnpm -r --filter './packages/*' pack --pack-destination ./.pack` before publishing.
- Build changed docs/demo apps.
- Smoke at least one install/import path from packed artifacts or the npm registry.

## Publish Gates

- Use the GitHub Actions Changesets flow by default.
- Ensure `NPM_TOKEN` and `NODE_AUTH_TOKEN` are both populated from the npm publish secret in release and canary workflows.
- Keep `NPM_CONFIG_PROVENANCE=true` for npm provenance-compatible publishes.
- After publish, verify npm registry versions for every changed package.

## Recovery

- If a generated release PR jumps to `1.0.0` unexpectedly, close it and fix `.changeset/config.json` before merging.
- If publish partially succeeds, do not retry blindly. Compare package versions on npm, regenerate the next release PR from the repaired config, and publish only the missing or next intended versions.
- If npm auth fails, record the failed run and required secret/permission fix in `.omx/yable-needs-user.md`.
