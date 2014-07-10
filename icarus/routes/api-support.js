var log = require('log4js').getLogger('APISupport');

(function () {
    'use strict';

    function ValidationException(message) {
        this.message = message;
    }

    function validateAction(req, mapping) {
        if (!req.body.Action || !mapping[req.body.Action]) {
            throw new ValidationException("Invalid Action: " + req.body.Action);
        }
        return mapping[req.body.Action];
    }

    module.exports = {
        ValidationException: ValidationException,

        getActionHandler: function (actionHandlers) {
            return function (req, res) {
                log.debug("REQ: " + JSON.stringify(req.body));
                try {
                    var handler = validateAction(req, actionHandlers);
                    handler(req.body).done(function (result) {
                        log.debug("RES: " + JSON.stringify(result));
                        res.send(result);
                    }, function (err) {
                        throw err;
                    });
                } catch (e) {
                    if (e instanceof ValidationException) {
                        res.send(400, e.message);
                    } else {
                        console.warn(e);
                        res.send(500, 'Internal Error');
                    }
                }
            }
        }};
})();
