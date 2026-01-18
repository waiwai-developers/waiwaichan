FROM node:24-bookworm-slim
ENV NODE_ENV=development
WORKDIR /app
RUN npm install -g corepack@latest && corepack enable \
 && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "dev:backend"]
