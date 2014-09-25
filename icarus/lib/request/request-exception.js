var util = require('util');

(function () {
    'use strict';

    function RequestException(namespace, code, message) {
        Error.call(this);


        var namespace = namespace;
        var code = code;
        var message = message;

        this.getNamespace = function () {
            return namespace;
        };

        this.getCode = function () {
            return code;
        };

        this.getMessage = function () {
            return message;
        };
    }

    util.inherits(RequestException, Error);

    module.exports = RequestException;
})();
