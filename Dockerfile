# Build stage
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./

# Install npm dependencies with forced platform and ignoring optional issues
RUN npm install --no-optional || npm install --force
RUN npm rebuild @swc/core || true

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
