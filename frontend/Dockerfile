FROM node:20-alpine AS base

WORKDIR /app
ENV BACKEND_URL=http://backend:3001
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
# Reuse node_modules from the build stage; avoids a second npm install.
EXPOSE 3000
CMD ["npm", "start"]
