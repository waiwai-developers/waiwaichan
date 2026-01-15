FROM node:24-alpine
WORKDIR /app
COPY . .
RUN apk update && apk add mysql-client logrotate
RUN npm i -g pnpm
RUN pnpm install --frozen-lockfile
RUN cp environment/testing/logrotate.conf /etc/logrotate.d/waiwaichan.conf
RUN cp -f /etc/periodic/daily/logrotate /etc/periodic/15min
CMD ["pnpm", "run", "dev"]
