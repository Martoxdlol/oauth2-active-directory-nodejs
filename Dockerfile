FROM node:14

WORKDIR /srv/app

ENV NODE_ENV=production
ENV WORKDIR_PATH=/srv/app

COPY package.json package.json

RUN npm install --production
RUN mkdir backend
RUN mkdir auth-app

COPY backend/package.json backend/package.json

WORKDIR /srv/app/backend

RUN npm install --production

WORKDIR /srv/app

COPY auth-app/package.json auth-app/package.json

WORKDIR /srv/app/auth-app

RUN npm install

RUN ls

RUN cat package.json

WORKDIR /srv/app

COPY . .

WORKDIR /srv/app/auth-app

RUN npm run build

WORKDIR /srv/app/backend

CMD ["node", "src/server.js"]