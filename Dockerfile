FROM node:22

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y iputils-ping
RUN npm clean-install

RUN npm run register

CMD [ "npm", "run", "start" ]
