FROM node:20 AS base
WORKDIR /app
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN npm rebuild bcrypt --build-from-source
COPY . .
RUN pnpm build

COPY --from=base /app ./

EXPOSE 3000
CMD ["pnpm", "start"]
