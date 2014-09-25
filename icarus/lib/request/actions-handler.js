'use strict';

var util = require('util');

var RequestHandler = require('./request-handler');
var RequestException = require('./request-exception');
var ActionHandler = require('./action/action-handler');

function InvalidActionException(actionName) {
    RequestException.call(this, "icarus.request.action", "InvalidAction", "InvalidAction: " + actionName);
}
util.inherits(InvalidActionException, RequestException);

function ActionsHandler() {
    RequestHandler.call(this);

    var actionHandlers = {};

    this.registerActionHandler = function (handler) {
        if (!handler instanceof ActionHandler) {
            throw "Action handler is not of type ActionHandler"
        }
        actionHandlers[handler.action_name] = handler;
    };

    this.handleMessage = function handleMessage(context) {
        var action = context.req.get('x-icarus-action');
        if (!action || !actionHandlers[action]) {
            throw new InvalidActionException(action);
        }
        var handler = actionHandlers[action];
        var output = handler.handleAction(context.req.body);
        context.res.send(output);
    };

    this.handleFault = function handleFault(context, fault) {
        if (fault instanceof RequestException) {
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
