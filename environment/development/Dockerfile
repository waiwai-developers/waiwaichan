FROM asia-northeast1-docker.pkg.dev/waiwai-406106/waiwaichan/image:latest
WORKDIR /app
COPY . .
RUN apk update && apk add mysql-client
RUN npm i -g pnpm
RUN pnpm install
CMD ["node", "app.js"]
