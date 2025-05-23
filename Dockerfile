FROM node:20 AS base
WORKDIR /app
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml ./

RUN pnpm install
RUN npm rebuild bcrypt --build-from-source

COPY . .

FROM node:20-alpine3.19 as release
WORKDIR /app
RUN npm i -g pnpm

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app .

EXPOSE 3000
EXPOSE 3001

CMD ["pnpm", "dev"]


