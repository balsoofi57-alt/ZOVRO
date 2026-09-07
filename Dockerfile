FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY . /app
RUN mkdir -p /app/backend/data && chown -R node:node /app
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8787/api/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","backend/server.js"]
