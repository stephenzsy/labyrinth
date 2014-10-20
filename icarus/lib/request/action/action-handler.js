'use strict';

module.exports = function ActionHandler(actionName, handler, opt) {
    this.actionName = actionName;
    var actionModel = opt.model.actions[actionName];

    this.validateInput = function validateInput(input) {

    };

    this.handleAction = handler;

    this.handleException = function handleException(exception) {

    };
};
