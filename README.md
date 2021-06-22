# Pairwise Example HTTP API

An Express server which exposes an example HTTP API for the Pairwise Async Challenges.

The server exposes simple `GET`, `PUT`, `POST`, and `DELETE` HTTP APIs at the `/api` path. The server is running at: [https://pairwise-example-http-api.appspot.com](https://pairwise-example-http-api.appspot.com).

## Getting Started

Install [NodeJS](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/lang/en/docs/) and run the following:

```sh
# Install dependencies
$ yarn install

# Run the server for development
$ yarn watch

# Run the build
$ yarn build
```

The project also has some linting rules and tests:

```sh
# Apply formatting rules
$ yarn format

# Run project unit tests
$ yarn test:unit

# Run project linting and tests
$ yarn test
```

## Deployment

The app is deployed to Google Cloud App Engine using Google Cloud Build when any commits are pushed to the `master` branch.
