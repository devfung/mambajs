const { SError } = require('error');
const _ = require('lodash');

class Exception extends SError {
    constructor(message = '', info = {}) {
        super(message, _.assignIn({}, info));
    }
}

module.exports = Exception;