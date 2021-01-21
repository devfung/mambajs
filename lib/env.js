const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Exception = require('./error');
const { statSync } = require('./util');

class NodeEnv {
    constructor () {}

    /**
     * 초기화
     * @param {options} opts 
     * @return Config
     */
    init(opts = { path: './configs' }) {
        // init 
        const env     = process.env.NODE_ENV || 'development';
        const envpath = `${opts.path}/${env}`;

        // check directory
        statSync(envpath);
        try {
            const files = fs.readdirSync(envpath);
            if (_.isEmpty(files)) { return; }

            // 배열을 돌면서 처리한다.
            const regexp = new RegExp(/(\.+env)/);
            files.forEach((file) => {
                if (!regexp.test(file)) { return; }

                // load .env file
                dotenv.config({path: path.resolve(envpath, file)});
            });

            this._env = Object.freeze({...process.env});
            return this;
        } catch (err) {
            throw new Exception(err.message);
        }
    }

    /**
     * 환경변수 정보 조회
     * @param {String} key 
     */
    get(key) {
       return _.get(this._env, key);
    }
}

module.exports = NodeEnv;