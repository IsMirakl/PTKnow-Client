FROM node:22-alpine AS build

WORKDIR /app

COPY PTKnow-Client/package.json PTKnow-Client/package-lock.json ./PTKnow-Client/
WORKDIR /app/PTKnow-Client
RUN npm ci

COPY PTKnow-Client/ ./

ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_RECAPTCHA_SITE_KEY=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/PTKnow-Client/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
