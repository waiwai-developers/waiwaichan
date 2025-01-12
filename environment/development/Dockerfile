FROM node:22.5.1-alpine
WORKDIR /app
COPY . .
RUN apk update && apk add mysql-client
RUN npm i -g pnpm
RUN pnpm install
CMD ["pnpm", "run", "dev"]
