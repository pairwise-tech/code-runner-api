# Pairwise Code Runner API

An Express server which exposes provides an API to evaluate non-JavaScript code challenges, e.g. Python, Rust, etc.

The app is deployed to: https://pairwise-code-runner-api.uc.r.appspot.com/.

## Getting Started

Install [NodeJS](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/lang/en/docs/) and run the following:

```sh
# Install dependencies
$ yarn install

# Run the server for development
$ yarn dev

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

This app is deployed using Google App Engine and re-deploys on any commits to the `main` branch.