var Config = require('../../config/config');
var express = require('express');
var router = express.Router();
var log = require('log4js').getLogger('Icarus');
var IcarusUtil = require('../../lib/util');
var https = require('https');
var Q = require('q');
var jsdom = require('jsdom');

(function () {
    'use strict';

    var ImporterRetriever = {
        angular: {
            retrieveLatestVersion: function (majorVersion) {
                return Q.Promise(function (resolve, reject, notify) {
                    https.get('https://code.angularjs.org/', function (res) {
                        var body = '';
                        res.on('data', function (d) {
                            body += d;
                        });
                        res.on('end', function () {
                            jsdom.env(body, function (errors, window) {
                                if (errors) {
                                    reject(errors);
                                }
                                var elements = window.document.getElementsByTagName('a');
                                var regexp = new RegExp('^' + majorVersion + '\/$');
                                for (var index in elements) {
                                    console.log(elements[index].innerHTML);
                                }

                                window.close();
                            });
                        })
                    }).on('error', function (e) {
                        console.error(e);
                        reject(e);
                    });
                    resolve('ok');
                });
            }
        }
    };

    // skip registration if role not configured
    if (!Config.roles.icarus.admin) {
        return;
    }

    var ActionHandlers = {
        ListPackages: function (req, callback) {
            callback(Config.packages);
        },
        ImportPackage: function (req, callback) {
            var appId = IcarusUtil.validateAppId(req);
            var p = Config.packages[appId];
            callback(p);
        },
        GetLatestVersion: function (req, callback) {
            var appId = IcarusUtil.validateAppId(req);
            var majorVersion = IcarusUtil.validateMajorVersion(req, appId);
            if (ImporterRetriever[appId]) {
                ImporterRetriever[appId].retrieveLatestVersion(majorVersion).then(function (data) {
                    callback(data);
                });
            }
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
            handler(req, function (result) {
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
})
();

module.exports = router;
