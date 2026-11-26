FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY client/package*.json ./client/
RUN npm ci --prefix client
COPY client ./client
RUN npm run build --prefix client

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=5000 \
    SQLITE_PATH=/data/helpdesk.sqlite \
    UPLOAD_DIR=/data/uploads

WORKDIR /app

COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix server \
    && mkdir -p /data/uploads \
    && chown -R node:node /data

COPY --chown=node:node server ./server
COPY --chown=node:node database ./database
COPY --from=build --chown=node:node /app/client/dist ./client/dist

VOLUME ["/data"]
EXPOSE 5000
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server/server.js"]
