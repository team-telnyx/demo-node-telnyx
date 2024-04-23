FROM node:20-alpine

RUN addgroup app && adduser -S -G app app
USER root

WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
RUN yarn global add nodemon
COPY . . 

EXPOSE 3000

USER app

CMD ["yarn", "start"]