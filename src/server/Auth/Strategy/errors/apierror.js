/**
 * `APIError` error.
 *
 * References:
 *   - https://developer.github.com/v3/#client-errors
 *
 * @constructor
 * @param {string} [message]
 * @param {number} [code]
 * @access public
 */
function APIError(message) {
  Error.call(this);
  Error.captureStackTrace(this);
  this.name = 'APIError';
  this.message = message;
  this.status = 500;
}

// Inherit from `Error`.

// eslint-disable-next-line no-proto
APIError.prototype.__proto__ = Error.prototype;

// Expose constructor.
module.exports = APIError;
