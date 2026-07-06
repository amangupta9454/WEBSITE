FROM ghcr.io/puppeteer/puppeteer:latest
# Switch to root to install dependencies if needed, but puppeteer image comes with everything
# We just need to copy our code
WORKDIR /app
COPY package*.json ./
# Run npm install as the puppeteer user (which is the default user in this image)
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
