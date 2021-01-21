const fs = require('fs');
const root = require('app-root-path');
const path = require('path');
const nconf = require('nconf');
const awilix = require('awilix');
const NodeEnv = require('./env');
const LogPencil = require('./logpencil');
const Loader = require('./loader');
const { lifetime, injectionMode, resolveType } = require('./util');

/**
 * create di container.
 */
function _createContainer() {
    const mamba = awilix.createContainer({
        // injectmode : PROXY
        // @see {https://www.npmjs.com/package/awilix#injection-modes}
        injectionMode: awilix.InjectionMode.PROXY
    });

    return mamba;
}

/**
 * create mamba config module.
 */
function _createConfigModule() {
    // load mamba configs.
    const confpath  = path.resolve(root.path);
    const extnames  = ['.js', '.json'];
    const basenames = ['mamba.config'];
    const confiles  = [];

    // 하위 경로의 모든 파일 검색
    const files = fs.readdirSync(confpath);
    files.forEach((file) => {
        basenames.forEach((name) => {
            // 패턴 생성.
            const regExp = `(${name})(${extnames[0]}|${extnames[1]})$`

            // 파일 패턴 확인.
            const patt = new RegExp(regExp, 'ig');
            if (!patt.test(file)) { return; }

            confiles.push(path.join(confpath, file));
        });
    });

    // @see {@link https://github.com/flatiron/nconf}
    // 이미 메모리에 올라가 있는 모든 것을 초기화 처리.
    nconf.reset();

    // use in-memory storage engines.
    // @see {@link https://www.npmjs.com/package/nconf#storage-engines}
    nconf.use('memory');

    // load config files
    confiles.forEach((file) => {
        // js 파일은 JSON으로 파싱해서 merge 수행
		const contents = (extnames[1] === path.extname(file) ? require(file) : JSON.parse(JSON.stringify(require(file))));
		nconf.merge(contents);
    });

    // load 함수를 호출해야 값을 조회할 수 있다.
    nconf.load();
    return nconf; 
}

/**
 * register env module.
 * @param {Container} mamba 
 * @param {Config} nconf  
 */
function _registerEnvModule(mamba, nconf) {
    // 환변변수 로드.
    const env = new NodeEnv();
    env.init({ path: nconf.get('envPath') });

    // 화변변수 관리자 등록.
    mamba.register({ env: awilix.asValue(env) });
    return env;
}

/**
 * register log module.
 * @param {Container} mamba 
 * @param {Config} nconf 
 */
function _registerLogModule(mamba, nconf) {
    const opts = nconf.get('logger') || {};
    
    // log 시스템 로드 
    const logpencil = new LogPencil();
    logpencil.init(opts);

    // Register the Mamba-log module.
    mamba.register({ log: awilix.asValue(logpencil) });
    return logpencil;
}

/**
 * Automatically scan and register the middleware.
 * @param {Container} mamba 
 * @param {Config} nconf 
 */
function _middlewareScan(mamba, nconf) {
    const loaders = nconf.get('middleware') || [];
    loaders.forEach((l) => {
        const loader = new Loader();
        loader.init(mamba, { 
            path: path.join(nconf.get('rootPath'), l.path),
            pattern: l.pattern
        });

        const module = {};
        module[l.name] = awilix.asValue(loader.getModules());
        mamba.register(module);
    });
}

/**
 * Automatically scan and register the dependency modules.
 * @param {Container} mamba 
 * @param {Config} nconf 
 */
function _modulesScan(mamba, nconf) {
    // 의존성 스켄
    const autoRequire = nconf.get('autoRequire');
    if (!autoRequire) { return; }

    const modules = autoRequire.modules || [];
    const globs = [];
    modules.forEach((m) => {
        const pattern = path.join(nconf.get('rootPath'), m.pattern);
        const options = {};

        // set register type
        if (m.register) {
            options['register'] = resolveType(m.register || 'asClass');
        }

        // set life time
        if (m.lifetime) {
            options['lifetime'] = lifetime(m.lifetime || 'singleton');
        }

        // set injection mode
        if (m.injectionMode) {
            options['injectionMode'] = injectionMode(m.injectionMode || 'proxy');
        }
        globs.push([pattern, options]);
    });

    mamba.loadModules(globs, {
        // module name format. 
        formatName: (autoRequire.formatName || 'camelCase'),

        // set global resolver options.
        resolverOptions: {
            lifetime: lifetime(autoRequire.lifetime || 'singleton'),
            register: resolveType(autoRequire.register || 'asClass'),
            injectionMode: injectionMode(autoRequire.injectionMode || 'proxy')
        }
    });
}

/**
 * mamba app 생성.
 *  - config 로드
 *  - env 로드
 * @param {Object} opts 
 */
function create() {
    // create container.
    const mamba = _createContainer();

    // create config module.
    const nconf = _createConfigModule();
    if (nconf) {
        // Register the Mamba-config module.
        mamba.register({ conf: awilix.asValue(nconf) });
    }

    // set path.
    const rootPath = path.resolve(root.path, nconf.get('rootPath') || './');
    const envPath  = path.resolve(rootPath, nconf.get('envPath') || './configs');
    nconf.set('rootPath', rootPath);
    nconf.set('envPath', envPath);

    // Register the default modules.
    _registerEnvModule(mamba, nconf);       // env module.
    _registerLogModule(mamba, nconf);       // log module.
    
    // scan middleware and register.
    _middlewareScan(mamba, nconf);
    
    // scan dependency modules and register.
    _modulesScan(mamba, nconf);
    
    return mamba;
}

module.exports = create;