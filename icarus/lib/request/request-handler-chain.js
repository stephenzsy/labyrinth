'use strict';

var util = require('util');

var RequestHandler = require('./request-handler');

module.exports = function RequestHandlerChain(chainOfHandlers) {
    if (!util.isArray(chainOfHandlers)) {
        throw "Handler chain is not an array";
    }

    var chain = [];
    var chain_length = 0;

    chainOfHandlers.forEach(function (handler) {
        if (!(handler instanceof RequestHandler)) {
            throw "Handler: " + handler.toString() + " is not an implementation of RequestHandler";
        }
        chain.push(handler);
        ++chain_length;
    });

    /**
     * Recursively apply the request handler chain
     * @param context
     * @param index
     */
    function chainHandleRequest(context, index) {
        if (index >= chain_length) {
            return;
        }
        var handler = chain[index];
        try {
            handler.handleMessage(context);
            chainHandleRequest(context, index + 1);
        } catch (e) {
            handler.handleFault(context, e);
        } finally {
            handler.close();
        }
    }

    /**
     * Handle Request
     * @param req ExpressJs Request object
     * @param res ExpressJs Response object
     */
    this.handle_request = function handle_request(req, res) {
        var context = {
            req: req,
            res: res
        };
        chainHandleRequest(context, 0);
    }
};
