import _ from 'lodash';

class InvalidInputError extends Error {
    public constructor(reason) {
        super(`Invalid input item${_.isString(reason) ? `: ${reason}` : ''}`);
    }
}

class ContextError extends Error {
    public constructor(reason) {
        super(`Invalid context${_.isString(reason) ? `: ${reason}` : ''}`);
    }
}

class HTTPNotFoundError extends Error {
    public constructor() {
        super('Template resource not found');
    }
}

class HTTPTimeoutError extends Error {
    public constructor() {
        super('Download template resource timed out');
    }
}

class DollieError extends Error {
  public code: string;

  public constructor(message: string) {
      super(message);
  }
}

export {
    InvalidInputError,
    ContextError,
    HTTPNotFoundError,
    HTTPTimeoutError,
    DollieError,
};
