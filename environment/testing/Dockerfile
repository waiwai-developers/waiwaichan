############################
# build stage
############################
FROM node:24-bookworm-slim AS builder
ENV NODE_ENV=testing
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
FROM gcr.io/distroless/nodejs24-debian13:latest
ENV NODE_ENV=testing
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nonroot:nonroot /app/logs ./logs
