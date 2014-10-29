var express = require('express');
var router = express.Router();
var path = require('path');
var ModelUtil = require('../lib/request/model-util');

(function () {
    'use strict';
    var INDEX_PATH = path.resolve('public/index.html');

    var MODELS = (function (serviceNames) {
        var result = {};
        serviceNames.forEach(function (serviceName) {
            try {
                result[serviceName] = ModelUtil.validateAndBuildModel(serviceName);
            } catch (e) {
                console.error("Service Model NOT loaded: " + serviceName);
                console.error(e.stack);
            }
        });
        return result;
    })([
        'configurations',
        'environments',
        'package-manager'
    ]);


    router.get('/service/:service', function (req, res) {
        var service = req.param('service');
        var model = MODELS[service];
        if (!model) {
            res.status(400).send('Invalid service: ' + service);
            return;
        }
        res.send(model);
    });

    router.get('/api-form/:service', function (req, res) {
        var service = req.param('service');
        var model = MODELS[service];
        if (!model) {
            res.status(400).send('Invalid service: ' + service);
            return;
        }
        if (model.namespace !== req.query.Namespace) {
            res.status(400).send('Invalid namespace: ' + req.query.Namespace + ', for service: ' + service);
            return;
        }
        // parse target
        var target = ModelUtil.findTarget(model, req.query.Target);
        res.render('../views/api-form', {
            target: target,
            ScopeAttributeName: req.query.ScopeAttributeName,
            ScopeAttributeValue: req.query.ScopeAttributeValue
        });
    });

    router.get(/^(.*)$/, function (req, res) {
        res.sendFile(INDEX_PATH);
    });
})();

module.exports = router;
