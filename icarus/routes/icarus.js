var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var Connection = require('ssh2');
var log = require('log4js').getLogger('Icarus');

var IcarusUtil = require('../lib/util');

(function () {
    'use strict';
    var INDEX_PATH = path.resolve('public/index.html');

    router.get(/^(.*)$/, function (req, res) {
        res.sendfile(INDEX_PATH);
    });

    var ActionHandlers = {
        ListRoles: function (req, callback, e) {
            callback(Config.roles[req.body.AppId]);
        },
        PassengerStatus: function (req, callback, e) {
            child_process.exec('passenger-status', function (error, stdout, stderr) {
                if (error) {
                    e(new IcarusUtil.ValidationException("Passenger not available"));
                    return;
                }
                callback(stdout);
            });
        }
    };

    router.post('/', function (req, res) {
        log.debug("REQ: " + JSON.stringify(req.body));
        try {
            var handler = IcarusUtil.validateAction(req, ActionHandlers);
            handler(req, function (result) {
                log.debug("RES: " + JSON.stringify(result));
                res.send(result);
            }, function (e) {
                if (e instanceof IcarusUtil.ValidationException) {
                    res.send(400, e.message);
                } else {
                    console.warn(e);
                    res.send(500, e);
                }
            });
        } catch (e) {
            if (e instanceof IcarusUtil.ValidationException) {
                res.send(400, e.message);
            } else {
                console.warn(e);
                res.send(500, e);
            }
        }
    });

    module.exports = router;
})();