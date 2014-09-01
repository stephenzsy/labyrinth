'use strict';

var util = require('util');

var RequestHandler = require('./request-handler');

function ActionsHandler() {
    RequestHandler.call(this);

    var actionHandlers = {};

    this.registerAction = function (name, handler, exceptions) {
        actionHandlers[name] = {handler: handler, exceptions: {}};
    };

    this.handle_message = function handle_message(context) {
        throw "Not Implemented";
    };

    this.handle_fault = function handle_fault(context, fault) {
        // internal error
        context["fault"] = fault;
        context.res.status(500).send("Internal Failure");
    };

}

util.inherits(ActionsHandler, RequestHandler);

module.exports = ActionsHandler;
