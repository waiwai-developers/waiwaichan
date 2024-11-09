FROM node:22.5.1-alpine
WORKDIR /app
COPY ./package.json /app/package.json
RUN apk update && apk add mysql-client
RUN npm install
CMD ["npm","run","dev"]
EXPOSE 3002
