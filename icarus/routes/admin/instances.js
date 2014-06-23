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

    function validateInstanceType(params) {
        var instanceType = params['InstanceType'];
        if (!instanceType || ['t1.micro', 'm1.small'].indexOf(instanceType)) {
            throw new IcarusUtil.ValidationException("Invalid or forbidden instance type: " + instanceType);
        }
        return instanceType;
    }

    function validateSubnet(params) {
        var subnet = params['Subnet'];
        if (!subnet || !subnet.match(/^subnet-[0-9a-f]+$/)) {
            throw new IcarusUtil.ValidationException("Invalid subnet: " + subnet);
        }
        return subnet;
    }

    function validateSecurityGroups(params) {
        var securityGroups = params['SecurityGroups'];
        var sgIds = [];
        if (!securityGroups) {
            throw new IcarusUtil.ValidationException("Invalid Security Groups: " + securityGroups);
        }
        for (var sgId in securityGroups) {
            if (securityGroups[sgId] && sgId.match(/^sg-[0-9a-f]+$/)) {
                sgIds.push(sgId);
            }
        }
        return sgIds;
    }

    var ActionHandlers = {
        GetEc2Configuration: function (req, callback) {
            callback(Config.aws.ec2);
        },
        LaunchInstance: function (req, callback) {
            var instanceType = validateInstanceType(req.body);
            var subnet = validateSubnet(req.body);
            var sgIds = validateSecurityGroups(req.body);
            callback(req.body);
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
            var instances = [];
            data.Reservations.forEach(function (reservation) {
                reservations.Instances.forEach(function (instance) {
                    instances.push(instance);
                });
            });
            res.send(instances);
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

    router.post('/ec2/DescribeSecurityGroups', function (req, res) {
        var ec2 = IcarusUtil.aws.getEc2Client();
        ec2.describeSecurityGroups({Filters: [
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