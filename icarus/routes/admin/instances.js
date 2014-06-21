var express = require('express');
var router = express.Router();
var IcarusUtil = require('../../lib/util');
var Config = require('../../config/config');

module.exports = router;

(function () {
    'use strict';

    // skip registration if role not configured
    if (!Config.roles.icarus.admin) {
        return;
    }

    var ActionHandlers = {
        GetEc2Configuration: function (req, callback) {
            callback(Config.aws.ec2);
        }
    };

    router.post('/', IcarusUtil.getActionHandler(ActionHandlers));

    router.post('/ec2/DescribeImages', function (req, res) {
        var ec2 = IcarusUtil.aws.getEc2Client();
        ec2.describeImages({Owners: ['self']}, function (err, data) {
            if (err) {
                res.send(400, err);
                return;
            }
            res.send(data);
        });
    });

    router.post('/ec2/DescribeInstances', function (req, res) {
        var ec2 = IcarusUtil.aws.getEc2Client();
        ec2.describeInstances({}, function (err, data) {
            if (err) {
                res.send(400, err);
                return;
            }
            res.send(data);
        });
    });

    router.post('/ec2/DescribeVpcs', function (req, res) {
        var ec2 = IcarusUtil.aws.getEc2Client();
        ec2.describeVpcs({}, function (err, data) {
            if (err) {
                res.send(400, err);
                return;
            }
            res.send(data);
        });
    });

    router.post('/ec2/DescribeSubnets', function (req, res) {
        var ec2 = IcarusUtil.aws.getEc2Client();
        ec2.describeSubnets({Filters: [
            {Name: 'vpc-id', Values: [Config.aws.ec2.appVpc]}
        ]}, function (err, data) {
            if (err) {
                res.send(400, err);
                return;
            }
            res.send(data);
        });
    });
})();