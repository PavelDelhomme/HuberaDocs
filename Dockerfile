FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY VERSION VERSION_NOTES.json ./
COPY api ./api
COPY web ./web
COPY content ./content
ENV NODE_ENV=production PORT=80
EXPOSE 80
CMD ["node", "api/server.mjs"]
