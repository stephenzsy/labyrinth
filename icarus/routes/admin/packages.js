var Config = require('../../config/config');
var express = require('express');
var router = express.Router();
var log = require('log4js').getLogger('Icarus');
var IcarusUtil = require('../../lib/util');

(function () {
    'use strict';

    // skip registration if role not configured
    if (!Config.roles.icarus.admin) {
        return;
    }

    var ActionHandlers = {
        ListPackages: function (req, res, callback) {
            var packages = {};
            for (var key in Config.packages) {
                var p = Config.packages[key];
                packages[key] = {
                    name: p.name
                };
            }
            callback(packages);
        }
    };

    router.get('/', function (req, res) {
        res.sendfile('public/admin/packages.html')
    });

    router.get('/:appId', function (req, res) {
        res.sendfile('public/admin/package.html')
    });

    router.post('/', function (req, res) {
        log.debug("REQ: " + JSON.stringify(req.body));
        try {
            var handler = IcarusUtil.validateAction(req, ActionHandlers);
            handler(req, res, function (result) {
                log.debug("RES: " + JSON.stringify(result));
                res.send(result);
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
})();

module.exports = router;
