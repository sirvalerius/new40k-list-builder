# --- Build stage -------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (better layer caching).
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build the static site.
COPY . .
RUN npm run build

# --- Serve stage -------------------------------------------------------------
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
