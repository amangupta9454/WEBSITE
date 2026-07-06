FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to copy files and install dependencies without EACCES errors
USER root
WORKDIR /app

COPY package*.json ./
RUN npm install

# Install exact Chrome version required by Puppeteer
RUN npx puppeteer browsers install chrome

COPY . .

# Change ownership of the app files to the puppeteer user
RUN chown -R pptruser:pptruser /app

# Switch back to the non-root user
USER pptruser

EXPOSE 4000
CMD ["npm", "start"]
