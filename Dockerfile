FROM node:latest

# Create the directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Install dependencies
COPY package.json /usr/src/bot
RUN npm install

# Copy bot
COPY . /usr/src/bot

# Start bot
CMD ["node", "app/bot.js"]