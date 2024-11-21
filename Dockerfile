FROM node:20.18.1-alpine
WORKDIR /app
COPY . .
RUN apk update && apk add mysql-client
RUN npm install
CMD ["node", "app.js"]
