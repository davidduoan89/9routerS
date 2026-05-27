# syntax=docker/dockerfile:1.7
# 9RouterS — Full monolith image (Server + UI).
# Use Dockerfile.server for server-only deployment.

ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS builder
WORKDIR /app

RUN apk --no-cache add python3 make g++ linux-headers

COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
  npm install

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="9routers"
LABEL org.opencontainers.image.source="https://github.com/davidduoan89/9routerS"

ENV NODE_ENV=production
ENV PORT=20128
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/open-sse ./open-sse
COPY --from=builder /app/src/mitm ./src/mitm
COPY --from=builder /app/node_modules/node-forge ./node_modules/node-forge
COPY --from=builder /app/node_modules/next ./node_modules/next

RUN apk --no-cache add su-exec && \
  mkdir -p /app/data /app/data-home && \
  chown -R node:node /app /app/data /app/data-home && \
  ln -sf /app/data-home /home/node/.9router && \
  printf '#!/bin/sh\nchown -R node:node /app/data /app/data-home 2>/dev/null\nexec su-exec node "$@"\n' > /entrypoint.sh && \
  chmod +x /entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:20128/api/health || exit 1

EXPOSE 20128
VOLUME ["/app/data"]

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
