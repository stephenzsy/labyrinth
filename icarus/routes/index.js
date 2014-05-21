'use strict';

var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

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

router.get('/vcs', function (req, res) {
    var appId = req.query.appId;
    var appLocalPath = Config['apps'][appId];
    if (!appLocalPath) {
        res.send(404, "AppId not found: " + appId);
        return;
    }
    child_process.exec('cd ' + appLocalPath + ';  git log -5 --pretty=format:"%h,%cd,%s";', function (error, stdout, stderr) {
        if (error) {
            console.error(error);
            res.send('404');
            return;
        }
        var commits = [];
        stdout.split("\n").forEach(function (line) {
            var parts = line.trim().split(',');
            if (parts.length < 3) {
                return;
            }
            var commitId = parts.shift();
            var date = parts.shift();
            var releaseNotes = parts.join(',');
            commits.push({
                hash: commitId,
                date: date,
                releaseNotes: releaseNotes
            });
            console.log(commitId, date, releaseNotes);
        });
        res.send({commits: commits});
    });
});

router.get('/artifact', function (req, res) {
    var appId = req.query.appId;
    if (!Config['apps'][appId]) {
        res.send(400);
        return;
    }
    var artifactConfig = Config['apps'][appId]['artifact'];
    var files = fs.readdirSync(artifactConfig['prepareDirectory']);
    /*
     files.forEach(function (file) {
     });
     files = fs.readdirSync(artifactConfig['prepareDirectory']);
     */
    var debug = {files: files};
    res.send({local: [], remote: [], debug: debug});
});

module.exports = router;
