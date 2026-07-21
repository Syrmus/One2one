# Build context is the repo root (needs the full pnpm workspace, incl. packages/shared).
FROM node:24-alpine AS build

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile

# Baked into the static bundle at build time (Vite inlines import.meta.env.* at build),
# not read at container runtime — must match the public origin the app is served from.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter web build

FROM nginx:alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80
