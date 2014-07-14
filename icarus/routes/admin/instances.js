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
        if (!instanceType || [
            't2.micro',
            't1.micro',
            'm1.small'
        ].indexOf(instanceType) < 0) {
            throw new IcarusUtil.ValidationException("Invalid or forbidden instance type: " + instanceType);
        }
        return instanceType;
    }

    function validateSubnet(params) {
        var subnet = params['Subnet'];
        if (!subnet || !subnet.match(/^subnet-[0-9a-f]+$/)) {
            throw new IcarusUtil.ValidationException("Invalid Subnet: " + subnet);
        }
        return subnet;
    }

    function validateSecurityGroups(params) {
        var securityGroups = params['SecurityGroups'];
        if (!securityGroups) {
            throw new IcarusUtil.ValidationException("Invalid Security Groups: " + securityGroups);
        }
        securityGroups.forEach(function (sgId) {
            if (!sgId.match(/^sg-[0-9a-f]+$/)) {
                throw new IcarusUtil.ValidationException("Invalid Security Group: " + sgId);
            }
        });
        return securityGroups;
    }

    function validateImageId(params) {
        var imageId = params['ImageId'];
        if (!imageId || !imageId.match(/^ami-[0-9a-f]+$/)) {
            throw new IcarusUtil.ValidationException("Invalid Image Id: " + imageId);
        }
        return imageId;
    }

    var ActionHandlers = {
        GetEc2Configuration: function (req, callback) {
            callback(Config.aws.ec2);
        },
        TerminateInstance: function (req, callback, error) {
            var ec2 = IcarusUtil.aws.getEc2Client();
            ec2.terminateInstances({InstanceIds: [req.body.InstanceId]}, function (err, data) {
                if (err) {
                    error(err);
                    return;
                }
                callback(data);
            });
        },
        LaunchInstance: function (req, callback, error) {
            var instanceType = validateInstanceType(req.body);
            var subnet = validateSubnet(req.body);
            var sgIds = validateSecurityGroups(req.body);
            var imageId = validateImageId(req.body);
            var parameters = {
                ImageId: imageId,
                MaxCount: 1,
                MinCount: 1,
                IamInstanceProfile: {
                    Arn: Config.aws.ec2.instance.iam_instance_profile.arn
                },
                InstanceType: instanceType,
                KeyName: Config.aws.ec2.instance.key_name,
                Monitoring: {
                    Enabled: false
                },
                NetworkInterfaces: [
                    {
                        DeviceIndex: 0,
                        AssociatePublicIpAddress: true,
                        Groups: sgIds,
                        SubnetId: subnet
                    }
                ]
            };
            var ec2 = IcarusUtil.aws.getEc2Client();
            ec2.runInstances(parameters, function (err, data) {
                if (err) {
                    error(err);
                    return;
                }
                callback(data);
            });
        },
        ListPackages: function (req, callback, error) {
            var dynamodb = IcarusUtil.aws.getDynamoDbClient();
            var table = Config.aws.dynamodb.icarus.table;
            var instanceId = req.body.InstanceId;
            var r = {
                InstanceId: instanceId,
                Packages: []
            };

            dynamodb.getItem({
                TableName: table,
                Key: { 'key': { S: 'i#' + instanceId}}
            }, function (err, data) {
                if (err) {
                    error(err);
                    return;
                }
                if (data.Item) {
                    if (data.Item.packages && data.Item.packages.SS) {
                        r['Packages'] = data.Item.packages.SS;
                    }
                    callback(r);
                } else {
                    dynamodb.putItem({
                        Item: {
                            'key': { S: 'i#' + instanceId},
                            'version': {N: '1'}
                        },
                        TableName: table,
                        Expected: {'key': {Exists: false}}
                    }, function (err, data) {
                        if (err) {
                            error(err);
                            return;
                        }
                        callback(r);
                    });
                }
            });
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
        var params = req.body;
        if(!params) {
            params = {};
        }
        ec2.describeInstances(params, function (err, data) {
            if (err) {
                res.send(400, err);
                return;
            }
            var instances = [];
            data.Reservations.forEach(function (reservation) {
                reservation.Instances.forEach(function (instance) {
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
