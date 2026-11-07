# Publish `mcp-stagehand` to npm (staff)

Do this once (or when releasing a new version) so players can run `npx -y mcp-stagehand`.

## Prerequisites

- npm account with publish rights for the package name
- Logged in: `npm whoami` (if not: `npm login`)
- Clean build: `npm run build` succeeds
- `package.json` `"name"` is the public name (`mcp-stagehand` unless scoped)

## Steps

```powershell
cd F:\Development\mcp-stagehand

# 1. Confirm identity
npm whoami

# 2. Make sure the name is free (404 = good / available)
npm view mcp-stagehand version

# 3. Build
npm run build

# 4. Dry run — see what would upload (no secrets; .env is gitignored)
npm publish --dry-run

# 5. Real publish (public registry)
npm publish --access public
```

If the name is taken, change `"name"` in `package.json` to something like `@teahouse/mcp-stagehand` and publish with `--access public` (scoped packages need that flag).

### Version bumps

```powershell
npm version patch   # 1.1.0 -> 1.1.1
npm publish --access public
```

Or edit `"version"` manually, then publish.

## After publish

1. Update [stagehand.quest docs](https://stagehand.quest/docs/stagehand/ai-helpers) if the package name changed.
2. Test on a clean machine / empty folder:

```powershell
npx -y mcp-stagehand
```

(Should start and wait on stdio; Ctrl+C to stop. Missing `STAGEHAND_API_KEY` should print a clear error.)

3. Point your own Codex config at `npx` (not a local `F:\Development\...` path) and run `stagehand_auth_check`.

## Do not publish

- `.env` (gitignored)
- Ops tokens
- `SERVER.md` is fine in the tarball for staff cloning the repo; players use the website docs

## Unpublish / yank

Only within npm’s time window and policies: `npm unpublish mcp-stagehand@x.y.z` — prefer `npm deprecate` for older versions.
