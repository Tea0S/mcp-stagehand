FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build
# Default: stdio (Cursor / Claude Desktop / Smithery).
# ChatGPT: override CMD to --transport http --host 0.0.0.0 --port 8080
ENTRYPOINT ["node", "build/index.js"]
EXPOSE 8080
