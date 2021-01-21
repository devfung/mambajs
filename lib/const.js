const awilix = require('awilix');

const ROUTE_FN_NAME = Object.freeze([
    'validate',
    'before',
    'action',
    'after'
]);

const HTTP_METHOD = Object.freeze([
    'GET',
    'POST',
    'PUT',
    'DELETE',
]);

// hook layer type names.
const HOOK_TYPE = Object.freeze({
    before: 'before',
    around: 'around',
    after : 'after'
});

// hook level names.
const HOOK_LEVEL = Object.freeze({
    application: 'application',      // express 전역 미들웨어 처리
    route: 'route'                   // express Route 레벨 미들웨어 처리
});

// 
const INJECTION_MODE = { 
    classic: awilix.InjectionMode.CLASSIC, 
    proxy: awilix.InjectionMode.PROXY
};
const LIFE_TIME      = {
    singleton: awilix.Lifetime.SINGLETON,
    transient: awilix.Lifetime.TRANSIENT,
    scoped: awilix.Lifetime.SCOPED,
};
const RESOLVER_TYPE  = {
    asClass: awilix.asClass,
    asValue: awilix.asValue,
    asFunction: awilix.asFunction,
    aliasTo: awilix.aliasTo,
};

module.exports = {
    ROUTE_FN_NAME,
    HTTP_METHOD,
    HOOK_TYPE,
    HOOK_LEVEL,
    INJECTION_MODE,
    LIFE_TIME,
    RESOLVER_TYPE,
};