'use strict';

function ValidationException(message) {
    this.message = message;
}

module.exports = {

    ValidationException: ValidationException,

    validateAction: function (req, mapping) {
        if (!req.body.Action || !mapping[req.body.Action]) {
            throw new ValidationException("Invalid Action: " + req.body.Action);
        }
        return mapping[req.body.Action];
    }
};