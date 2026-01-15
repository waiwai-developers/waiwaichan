############################
# build stage
############################
FROM node:24-bookworm-slim AS builder
ENV NODE_ENV=development
WORKDIR /app
RUN npm install -g corepack@latest && corepack enable
RUN corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
RUN mkdir -p logs

############################
# runtime stage
############################
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=development
WORKDIR /app
RUN npm install -g corepack@latest && corepack enable
RUN corepack prepare pnpm@latest --activate
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/tests ./tests
COPY --from=builder --chown=node:node /app/logs ./logs
CMD ["pnpm", "run", "dev"]
