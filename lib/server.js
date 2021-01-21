const _ = require('lodash');
const express = require('express');
const { HOOK_LEVEL, HOOK_TYPE, HTTP_METHOD } = require('./const');

class Server {
    constructor() { }

    init({ app, routes = [], hooks = [] }) {
        // *** load application ***
        // load -> application level before layer hook
        this._applyMiddleware(app, this._hookFilter(hooks, { 
            level: HOOK_LEVEL.application, 
            type: HOOK_TYPE.before 
        }));

        // load -> application level around layer hook 
        this._applyMiddleware(app, this._hookFilter(hooks, { 
            level: HOOK_LEVEL.application, 
            type: HOOK_TYPE.around 
        }));

        // ***load routes loop 
        // {
        routes.forEach((r) => {
            HTTP_METHOD.forEach((method) => {
                if (!r[method]) { return; }
                const uris = _.keys(r[method]);

                if (!uris) { return; }
                uris.forEach((uri) => {
                    const exclude = `${r.path}${uri}`;

                    // load -> route level before layer hook 
                    const before = this._hookFilter(hooks, { 
                        level: HOOK_LEVEL.route, 
                        type: HOOK_TYPE.before 
                    }, exclude);
                    
                    // load -> route level around layer hook 
                    const around = this._hookFilter(hooks, { 
                        level: HOOK_LEVEL.route, 
                        type: HOOK_TYPE.around 
                    }, exclude);

                    // load -> route level after layer hook
                    const after = this._hookFilter(hooks, { 
                        level: HOOK_LEVEL.route, 
                        type: HOOK_TYPE.after 
                    }, exclude);

                    // load -> route [ validate -> before -> action -> after ] 
                    let fnchains = [];
                    const routefns = r[method][uri];
                    if (!_.isEmpty(before)) { fnchains = _.concat(fnchains, before); }
                    if (!_.isEmpty(around)) { fnchains = _.concat(fnchains, around); }
                    if (routefns.validate) { fnchains = _.concat(fnchains, routefns.validate); }
                    if (routefns.before) { fnchains = _.concat(fnchains, routefns.before); }
                    if (!routefns.action) {
                        throw new Error(`Bad route in '${exclude}' has invalid action.`);
                    }
                    if (routefns.action) { fnchains = _.concat(fnchains, routefns.action); }
                    if (routefns.after) { fnchains = _.concat(fnchains, routefns.after); }
                    if (!_.isEmpty(around)) { fnchains = _.concat(fnchains, around); }
                    if (!_.isEmpty(after)) { fnchains = _.concat(fnchains, after); }

                    const route = express.Router();
                    route[_.lowerCase(method)](uri, fnchains);
                    app.use(r.path, route);
                });
            });
        });
        // } 
        
        // load -> application level around layer hook
        this._applyMiddleware(app, this._hookFilter(hooks, { 
            level: HOOK_LEVEL.application, 
            type: HOOK_TYPE.around 
        }));

        // load -> application level after layer hook
        this._applyMiddleware(app, this._hookFilter(hooks, { 
            level: HOOK_LEVEL.application, 
            type: HOOK_TYPE.after 
        }));

        // set app
        if (app) {
            this.app = app;
        }
        return this;
    }

    /**
     * filtering & sortby 'layer'
     * @param {*} hook 
     * @param {*} param1 
     */
    _hookFilter(hooks, opts = { 
        level: HOOK_LEVEL.application, 
        type: HOOK_TYPE.before, 
    }, exclude = '') {
        // filter hooks
        let results = _.filter(hooks, opts);

        // Filter the exclude URI if the HOOK level is 'route'.
        if (opts.level === HOOK_LEVEL.route) {
            results = _.reject(results, (o) => { 
                return (_.indexOf(o.exclude, exclude) >= 0)
            });
        }

        if (!results || _.isEmpty(results)) {
            return [];
        }

        // sortBy layer.
        const sortResults = _.sortBy(results, ['layer']);

        let fns = [];
        sortResults.forEach((e) => { 
            fns = _.concat(fns, e.action); 
        });

        return fns;
    }

    /**
     * 
     * @param {*} app 
     * @param {*} middlewares 
     */
    _applyMiddleware(app, middlewares) {
        if (!app) { return; }
        if (!middlewares || _.isEmpty(middlewares)) { return; }
        if (!_.isArray(middlewares)) { return; }

        app.use(middlewares);
    }
}

module.exports = Server;