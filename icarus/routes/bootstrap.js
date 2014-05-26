'use strict';

var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

function getEc2() {
    return  new AWS.EC2({
        endpoint: new AWS.Endpoint(Config['aws']['ec2']['endpoint']),
        region: Config['aws']['region'],
        credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey'])
    });
}

router.get('/:instanceId', function (req, res) {
    var instanceId = req.params['instanceId'];
    res.render('bootstrap', { instanceId: instanceId});
    describeInstances();
});

router.post('/ec2/describeInstances', function (req, res) {
    var ec2 = getEc2();
    var instanceIds = req.body.InstanceIds;
    ec2.describeInstances({'InstanceIds': instanceIds}, function (err, data) {
        if (err) {
            res.send(400, err);
            return;
        }
        res.send(data);
    });
});

module.exports = router;
