# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_ERP_APP_URL=http://localhost:3000
ENV VITE_ERP_APP_URL=$VITE_ERP_APP_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-website.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
