const fs = require('fs');
const Exception = require("./error");
const cnst = require('./const');

/**
 * 폴더 존제여부 확인.
 * @param {String} path 
 */
const statSync = (path) => {
    try {
        fs.statSync(path);
    } catch (err) {
        // ENOENT: no such file or directory, stat './test'
        throw new Exception(`ENOENT: The directory '${path}' does not exist.`);
    }
};

// get injection mode
const injectionMode = (mode) => {
    return (cnst.INJECTION_MODE[mode] || cnst.INJECTION_MODE.proxy);
};

// get life time
const lifetime = (mode) => {
    return (cnst.LIFE_TIME[mode] || cnst.LIFE_TIME.singleton);
};

// get resolve type
const resolveType = (type) => {
    return (cnst.RESOLVER_TYPE[type] || cnst.RESOLVER_TYPE.asClass);
};

module.exports = {
    statSync,
    injectionMode,
    lifetime,
    resolveType
};