const _ = require('lodash');
const fs = require('fs');
const Exception = require('./error');
const { statSync } = require('./util');

class Loader {
    constructor() {}

    /**
     * load modules
     * @param {String} hookpath 
     */
    init(mamba, opts = {
        path: '', 
        pattern: /\.js/g
    }) {
        const loadpath = opts.path || './';
        const pattern  = opts.pattern || /\.js/g;

        // check directory
        statSync(loadpath);

        // load modules.
        try {
            this._modules = [];
            const files = fs.readdirSync(loadpath);
            if (_.isEmpty(files)) { return; }

            // 배열을 돌면서 처리한다.
            const regexp = new RegExp(pattern);
            files.forEach((file) => {
                if (!regexp.test(file)) { return; }
                this._modules.push(require(`${loadpath}/${file}`)(mamba));
            });

            return this;
        } catch (err) {
            throw new Exception(err.message);
        }
    }

    /**
     * Return modules.
     */
    getModules() {
        return this._modules;
    }
}

module.exports = Loader;