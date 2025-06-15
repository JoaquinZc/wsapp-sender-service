###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:20-slim As development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./

# Skip chromium download with puppeteer on yarn install
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true  \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN yarn install

# Bundle app source
COPY --chown=node:node . .

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:20-slim As build

# Set workdir
WORKDIR /usr/src/app

COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# SET CHROMIUM CONFIG
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true  \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Run the build command which creates the production bundle
RUN yarn build

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Running `npm ci` removes the existing node_modules directory and passing in --only=production ensures that only the production dependencies are installed. This ensures that the node_modules directory is as optimized as possible
RUN yarn install --production && yarn cache clean --all

USER node

###################
# PRODUCTION
###################

FROM node:20-slim As production

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
# Install necessary dependencies for Puppeteer and Chromium
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango1.0-0 \
    libnss3 \
    libxss1 \
    libxcursor1 \
    wget \
    gnupg \
    # Instalar Chromium desde repositorios
    chromium \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

#ENV XDG_CONFIG_HOME=/tmp/.chromium
#ENV XDG_CACHE_HOME=/tmp/.chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true  \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

WORKDIR /usr/src/app

RUN mkdir .wwebjs_auth
RUN mkdir .wwebjs_cache
RUN mkdir public
RUN mkdir public/images

RUN chown -R node:node /usr/src/app/.wwebjs_auth
RUN chown -R node:node /usr/src/app/.wwebjs_cache
RUN chown -R node:node /usr/src/app/public

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/data ./data

RUN chown -R node:node /usr/src/app/data

#RUN chown -R node:node /usr/src/app

USER node

EXPOSE 3000

# Start the server using the production build
CMD [ "yarn", "start:prod" ]