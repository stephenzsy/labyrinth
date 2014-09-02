'use strict';

var util = require('util');

var RequestHandler = require('./request-handler');
var ActionHandler = require('./action/action-handler');

function InvalidActionException(actionName) {
    this.getMessage = function () {
        return "InvalidAction: " + actionName;
    };
}

function ActionsHandler() {
    RequestHandler.call(this);

    var actionHandlers = {};

    this.registerActionHandler = function (handler) {
        if (!handler instanceof ActionHandler) {
            throw "Action handler is not of type ActionHandler"
        }
        actionHandlers[handler.action_name] = handler;
    };

    this.handle_message = function handle_message(context) {
        var action = context.req.get('x-icarus-action');
        if (!action || !actionHandlers[action]) {
            throw new InvalidActionException(action);
        }
        var handler = actionHandlers[action];
        var output = handler.handle_action(context.req.body);
        context.res.send(output);
    };

    this.handle_fault = function handle_fault(context, fault) {
        if (fault instanceof InvalidActionException) {
            context.res.status(400).send(fault.getMessage());
            return;
        }

        // internal error
        context["fault"] = fault;
        console.error(fault);
        context.res.status(500).send("Internal Failure");
    };
}

util.inherits(ActionsHandler, RequestHandler);

module.exports = ActionsHandler;
