FROM node:16.13.0-alpine3.14

# RUN addgroup app && adduser -S -G app app
# USER app

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -g nodemon
COPY . . 

EXPOSE 3000

CMD ["npm", "start"]