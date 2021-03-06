'use-strict';

var path = require('path');
var express = require('express');

var router = express.Router();
var RequestHandlerChain = require('../lib/request/request-handler-chain');
var ActionsHandler = require('../lib/request/actions-handler');
var ActionHandler = require('../lib/request/action/action-handler');

(function () {
    'use strict';

    var actionsHandler = new ActionsHandler();

    var chain = new RequestHandlerChain([
        actionsHandler
    ]);

    router.post('/', chain.handle_request);
})();

module.exports = router;