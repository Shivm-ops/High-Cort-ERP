# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_ERP_APP_URL=http://localhost:3000
ENV VITE_ERP_APP_URL=$VITE_ERP_APP_URL
ARG VITE_ADMIN_APP_URL=http://localhost:3001
ENV VITE_ADMIN_APP_URL=$VITE_ADMIN_APP_URL
ARG VITE_WEB3FORMS_ACCESS_KEY=2331143f-9c75-4def-8367-75e6f7890ec9
ENV VITE_WEB3FORMS_ACCESS_KEY=$VITE_WEB3FORMS_ACCESS_KEY

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-website.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
