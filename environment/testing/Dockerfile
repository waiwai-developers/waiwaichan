FROM node:22.5.1-alpine
WORKDIR /app
COPY . .
RUN cp .envtest .env && \
    cp config/databasetest.json config/database.json && \
    cp config/configtest.json config/config.json && \
    cp config/accountstest.json config/accounts.json && \
    cp config/roletest.json config/role.json
RUN apk update && apk add mysql-client logrotate
RUN npm i -g pnpm
RUN pnpm install --frozen-lockfile
RUN cp environment/testing/logrotate.conf /etc/logrotate.d/waiwaichan.conf
RUN cp -f /etc/periodic/daily/logrotate /etc/periodic/15min
CMD ["pnpm", "run", "dev"]
