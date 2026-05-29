
FROM node:20 AS base
WORKDIR /app
RUN npm i -g pnpm

# MODIFICA 1: Copiamo solo il package.json (senza il file di lock che manca)
COPY package.json ./
#COPY package.json pnpm-lock.yaml ./

# MODIFICA 2: Installazione standard senza il vincolo del lockfile
RUN pnpm install

RUN npm rebuild bcrypt --build-from-source
COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]