# Build stage
FROM node:18-buster AS build

WORKDIR /app

COPY package*.json ./

# Install build dependencies
RUN apt-get update && apt-get install -y build-essential python3

# Install npm dependencies
RUN npm install

COPY . .

# Force rebuild of native modules
RUN npm rebuild

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
