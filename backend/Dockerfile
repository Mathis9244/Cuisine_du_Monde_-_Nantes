FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

FROM base AS deps
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
# Reuse node_modules from the build stage to avoid a second npm install
# (more reliable in constrained network environments during docker build).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
RUN npm prune --omit=dev
COPY --from=build /app/prisma ./prisma/
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/modules/bootstrap/seed-data.json ./dist/src/modules/bootstrap/seed-data.json
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
