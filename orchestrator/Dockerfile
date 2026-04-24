FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY orchestrator/server.js ./server.js
EXPOSE 8420
CMD ["node", "server.js"]
