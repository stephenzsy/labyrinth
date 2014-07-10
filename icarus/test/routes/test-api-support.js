var APISupport = require('../../routes/api-support');
var Q = require('q');

exports.testGetActionHandler = function (test) {
    var ActionHandlers = {
        BadAction: function () {
            throw "TestException";
        },
        TestAction: function (params) {
            return Q.fcall(function () {
                return params;
            });
        }
    };
    var handler = APISupport.getActionHandler(ActionHandlers);
    handler({body: {
        Action: 'Invalid'
    }}, {
        send: function () {
            test.equals(400, arguments[0]);
        }
    });

    handler({body: {
        Action: 'BadAction'
    }}, {
        send: function () {
            test.equals(500, arguments[0]);
        }
    });

    var req = {body: {
        Action: 'TestAction'
    }};
    handler(req, {
        send: function () {
            test.equals(req.body, arguments[0]);
        }
    });
    test.done();
};
