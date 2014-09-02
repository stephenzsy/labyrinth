module.exports = function ActionHandler(name, handler, exceptions) {

    this.action_name = name;

    this.handle_action = handler;

    this.exceptions = exceptions;
};
