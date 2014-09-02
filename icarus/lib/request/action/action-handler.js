'use strict';

module.exports = function ActionHandler(handler, opt) {
    this.handle_action = handler;

    var modelSpec = require(opt.model.path);

    this.validateInput = function validateInput(input) {

    };

    this.handleAction = handler;

    this.handleException = function handleException(exception) {

    }
};
