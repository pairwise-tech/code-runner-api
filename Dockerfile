FROM pairwise-code-runner-base

WORKDIR /usr/src/app
COPY . .

# Install dependencies
RUN yarn

# Build the app
RUN yarn build

CMD ["node", "build/app.js"]