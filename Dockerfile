FROM node:22.5.1-alpine
ENV NODE_ENV=development
WORKDIR /app
COPY ./package.json /app/package.json
RUN npm install
CMD ["node", "app.js"]