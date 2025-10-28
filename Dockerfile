FROM node:22

COPY . .

RUN apt install iputils-ping
RUN npm i

CMD [ "npm", "run", "start" ]