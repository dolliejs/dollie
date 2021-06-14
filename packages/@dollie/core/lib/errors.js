const _ = require('lodash');

class InvalidInputError extends Error {
  constructor(reason) {
    super(`Invalid input item${_.isString(reason) ? `: ${reason}` : ''}`);
  }
}

class ContextError extends Error {
  constructor(reason) {
    super(`Invalid context${_.isString(reason) ? `: ${reason}` : ''}`);
  }
}

class HTTPNotFoundError extends Error {
  constructor() {
    super('Template resource not found');
  }
}

class HTTPTimeoutError extends Error {
  constructor() {
    super('Download template resource timed out');
  }
}

module.exports = {
  InvalidInputError,
  ContextError,
  HTTPNotFoundError,
  HTTPTimeoutError,
};
