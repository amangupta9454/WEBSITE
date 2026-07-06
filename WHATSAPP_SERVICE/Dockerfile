FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to copy files and install dependencies without EACCES errors
USER root
WORKDIR /app

# Tell Puppeteer to skip downloading Chrome and use the pre-installed one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm install

COPY . .

# Change ownership of the app files to the puppeteer user
RUN chown -R pptruser:pptruser /app

# Switch back to the non-root user
USER pptruser

EXPOSE 4000
CMD ["npm", "start"]
