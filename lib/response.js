const _ = require('lodash');
const moment = require('moment');

// Response class base.
class Response {
    constructor(data = {}) {
        // create default response
        this.timestamp = moment().valueOf();
        this.data = data;
    }

    toJSON() {
        return {
            ...this
        }
    }
}

// success response
class SuccessResponse extends Response {
    constructor(data = {}, request = {}) {
        super(data);
        this.success = true;
        this.request = request;
    }
}

// error response
class ErrorResponse extends Response {
    constructor(
        data = {},         // 추가 정보
        request = {},      // 요청 정보
        {
            code = ''
            , message = ''
            , type = ''
            , stack = ''
        } = {}              // 에러 기본 정보
    ) {
        super(data);
        this.success = false;
        this.error = {
            code
            , message
            , type
            , stack
        };
        this.request = request;
    }
}

module.exports = {
    SuccessResponse
    , ErrorResponse
}