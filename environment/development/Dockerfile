FROM node:24-alpine
RUN apk add --no-cache \
    mysql-client \
    logrotate
ENV NODE_ENV=development
WORKDIR /app
RUN corepack enable \
    && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install \
    --frozen-lockfile \
    --prefer-offline
COPY . .
RUN cp environment/development/logrotate.conf /etc/logrotate.d/waiwaichan.conf \
    && cp -f /etc/periodic/daily/logrotate /etc/periodic/15min
CMD ["pnpm", "run", "dev"]
