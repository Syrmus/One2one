# Build context is the repo root (needs the full pnpm workspace, incl. packages/shared).
# Run via tsx rather than a tsc-compiled build: tsconfig.base.json uses
# "moduleResolution": "Bundler" with extensionless relative imports, which plain
# `node dist/index.js` can't resolve under Node's ESM loader without rewriting every
# import to add a .js extension. tsx sidesteps that — same runtime as local dev.
FROM node:24-alpine

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /repo/apps/api

ENV NODE_ENV=production
EXPOSE 3001

CMD ["pnpm", "start"]
