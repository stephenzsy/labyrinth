'use strict';

module.exports = function RequestException(namespace, type, message) {
    var namespace = namespace;
    var type = type;
    var message = message;

    this.getNamespace = function () {
        return namespace;
    };

    this.getType = function () {
        return type;
    };

    this.getMessage = function () {
        return message;
    };
};
