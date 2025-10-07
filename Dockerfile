FROM node:22-alpine AS builder

ENV DIR=/app
WORKDIR $DIR

COPY package*.json ./

RUN npm install && \
  npm cache clean --force

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

FROM node:22-alpine AS prod-deps

ENV DIR=/app
WORKDIR $DIR

COPY package*.json ./

RUN npm install --omit=dev --ignore-scripts && \
  npm cache clean --force && \
  rm -rf ~/.npm

FROM node:22-alpine AS production

ARG MICRO_NAME={service_name}

WORKDIR /${MICRO_NAME}/src/app

ENV USER=node

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER $USER

EXPOSE 8080

CMD ["node", "dist/main.js"]
