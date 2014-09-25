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
    })(['configurations']);


    router.get('/service/:service', function (req, res) {
        var service = req.param('service');
        var model = MODELS[req.param('service')];
        if (!model) {
            req.status(400).send('Invalid service: ' + service);
            return;
        }
        req.send(model);
    });

    router.get('/api-form/:service', function (req, res) {
        var service = req.param('service');
        var model = MODELS[req.param('service')];
        if (!model) {
            req.status(400).send('Invalid service: ' + service);
            return;
        }
        if (model.namespace !== req.query.namespace) {
            req.status(400).send('Invalid namespace: ' + req.query.namespace + ', for service: ' + service);
            return;
        }
        // parse target
        console.log(req.query);
        res.render('../views/api-form', {service: model});
    });

    router.get(/^(.*)$/, function (req, res) {
        res.sendFile(INDEX_PATH);
    });
})();

module.exports = router;
