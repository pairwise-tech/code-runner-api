FROM nikolaik/python-nodejs:python3.9-nodejs14-alpine

WORKDIR /usr/src/app
COPY . .

# Get Ubuntu packages
RUN apk update
RUN apk upgrade
RUN apk add bash
RUN apk add curl
RUN apk add build-base

# Get Rust
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y

# Add cargo to path
ENV PATH="/root/.cargo/bin:${PATH}"

# Get Python formatter
RUN pip3 install --upgrade autopep8

# Build the app
RUN yarn
RUN yarn build

# Expose port
EXPOSE 6001

CMD ["node", "build/app.js"]