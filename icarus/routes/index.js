'use strict';

var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');

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
        })
        res.send(instances);
    });

});

module.exports = router;
