# Backend Dockerfile
FROM node:20-alpine

# better-sqlite3 needs build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production     PORT=4000     UPLOAD_DIR=/app/uploads

# ensure upload dir exists at runtime
RUN mkdir -p /app/uploads /app/data

EXPOSE 4000
CMD ["npm", "run", "start"]
