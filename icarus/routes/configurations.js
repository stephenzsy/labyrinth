'use-strict';

var path = require('path');
var express = require('express');

var router = express.Router();
var RequestHandlerChain = require('../lib/request/request-handler-chain');
var ActionsHandler = require('../lib/request/actions-handler');
var ActionHandler = require('../lib/request/action/action-handler');

var ModelUtil = require('../lib/request/model-util');

(function () {
    'use strict';

    var actionsHandler = new ActionsHandler();
    var MODEL = ModelUtil.validateAndBuildModel('configurations');

    actionsHandler.registerActionHandler(new ActionHandler('CreateConfigurationDefinition', function (input) {
        console.log(input);
        return {};
    }, {model: MODEL}));

    var chain = new RequestHandlerChain([
        actionsHandler
    ]);

    router.post('/', chain.handle_request);
})();

module.exports = router;