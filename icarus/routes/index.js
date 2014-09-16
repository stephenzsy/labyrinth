var express = require('express');
var router = express.Router();
var path = require('path');

(function () {
    'use strict';
    var INDEX_PATH = path.resolve('public/index.html');

    function findPath(model, path) {

    }

    function expand(model, rootModel) {

    }

    function expandServiceModel(service) {
        var serviceModel = require('../models/' + service + '.json');
        expand(serviceModel.structures, serviceModel);
        if (serviceModel.actions) {
            serviceModel.actions.forEach(function (action) {
                expand(action.input, serviceModel);
            });
        }
        return serviceModel;
    }

    var MODELS = {
        'configurations': expandServiceModel('configurations')
    };

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
