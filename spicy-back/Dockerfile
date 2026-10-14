# syntax=docker/dockerfile:1
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY spicy-front/package.json ./spicy-front/package.json
COPY spicy-admin/package.json ./spicy-admin/package.json
COPY spicy-supadmin/package.json ./spicy-supadmin/package.json
COPY spicy-back/package.json ./spicy-back/package.json
RUN npm ci --omit=dev --workspace=spicy-back --include-workspace-root=false --no-audit --no-fund
COPY --chown=node:node spicy-back ./spicy-back
COPY --chown=node:node spicy-data ./spicy-data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "spicy-back/src/server.js"]
