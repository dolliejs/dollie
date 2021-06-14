const _ = require('lodash');

class InvalidInputError extends Error {
  constructor(reason) {
    super(`Invalid Input${_.isString(reason) ? `: ${reason}` : ''}`);
  }
}

module.exports = {
  InvalidInputError,
};
