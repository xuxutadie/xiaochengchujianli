# Build stage
FROM node:18-bookworm AS build

WORKDIR /app

COPY package*.json ./

# Install npm dependencies
RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
