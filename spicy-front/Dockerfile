# syntax=docker/dockerfile:1
# Override these arguments with version@sha256:digest references when pinning a release.
ARG NODE_IMAGE=node:24-alpine
ARG NGINX_IMAGE=nginx:stable-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
COPY tests ./tests
RUN npm test && npm run build

FROM ${NGINX_IMAGE} AS runtime
LABEL org.opencontainers.image.title="Spicy Food Truck" \
      org.opencontainers.image.description="Spicy Food Truck static frontend"
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
# Own complete config; no runtime templating or writes to /etc/nginx are needed.
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
