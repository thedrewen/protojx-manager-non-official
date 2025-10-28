FROM node:22

COPY . .

RUN apt-get update && apt-get install -y iputils-ping
RUN npm i

CMD [ "npm", "run", "start" ]