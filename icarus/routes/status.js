var express = require('express');
var Q = require('q');
var IcarusUtil = require('../lib/util');
var APISupport = require('./api-support');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var Config = require('../config/config');

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

    var authParams = null;
    if(!Config.roles.icarus.admin) {
        authParams =  {
            required: true,
            subjectDN: Config.security.adminClientCertSubjectDN
        };
    }

    router.post('/', APISupport.getActionHandler(ActionHandlers, {logHeaders: true, auth: authParams}));

    module.exports = router;
})();