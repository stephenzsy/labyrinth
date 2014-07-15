var express = require('express');
var Q = require('q');
var IcarusUtil = require('../lib/util');
var APISupport = require('./api-support');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var cors = require('cors');

(function () {
    'use strict';

    var ActionHandlers = {
        GetStatus: function (params) {
            return Q.nfcall(fs.readFile, path.resolve('package.json'))
                .then(function (data) {
                    var original = JSON.parse(data);
                    return {
                        version: original.version
                    }
                });
        }
    };

    router.post('/', APISupport.getActionHandler(ActionHandlers));
    router.options('/', cors());

    module.exports = router;
})();