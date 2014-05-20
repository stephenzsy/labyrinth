'use strict';

var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Icarus' });
});

router.get('/instances', function (req, res) {
    var ec2 = new AWS.EC2({
        endpoint: new AWS.Endpoint(Config['aws']['ec2']['endpoint']),
        region: Config['aws']['region'],
        credentials: new AWS.Credentials(Config['aws']['credentials']['accessKeyId'], Config['aws']['credentials']['secretAccessKey'])
    });
    var response = ec2.describeInstances({}, function (err, data) {
        if (err) {
            res.send(500, err);
            return;
        }
        var reservations = data['Reservations'];
        var instances = [];
        reservations.forEach(function (reservation) {
            instances = instances.concat(reservation['Instances']);
        });
        res.send(instances);
    });
});

router.get('/current', function (req, res) {
    console.log(req.params);
    var appId = req.query.appId;
    var appLocalPath = Config['apps'][appId];
    if (!appLocalPath) {
        res.send(404, "AppId not found: " + appId);
        return;
    }
    child_process.exec('cd ' + appLocalPath + '; git log -1 --abbrev-commit --oneline;', function (error, stdout, stderr) {
        if (error) {
            console.error(error);
            res.send('404');
            return;
        }
        var commitId = stdout.trim().match(/^([0-9a-f]+)/)[0];
        res.send({commitId: commitId});
    });
});

router.get('/artifact/:appId', function (req, res) {
    res.send({local: [], remote: []});
});

module.exports = router;
