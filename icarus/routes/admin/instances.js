var express = require('express');
var router = express.Router();
var IcarusUtil = require('../../lib/util');
var APISupport = require('../api-support');
var Config = require('../../config/config');
var Q = require('q');
var https = require('https');
var fs = require('fs');

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

    function queryInstance(hostname, path, request) {
        var options = {
            hostname: hostname,
            port: 9443,
            path: path,
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },

            cert: fs.readFileSync(Config.security.adminClientCertPath),
            key: fs.readFileSync(Config.security.adminClientKeyPath),
            ca: fs.readFileSync(Config.security.caCertPath),
            rejectUnauthorized: false
        };

        return Q.Promise(function (c, e, p) {
            var req = https.request(options, function (res) {
                console.log("statusCode: ", res.statusCode);
                console.log("headers: ", res.headers);

                var data = '';

                res.on('data', function (d) {
                    data += d;
                });
                res.on('end', function (d) {
                    console.log(data);
                    c(JSON.parse(data));
                });
            });
            req.on('error', function (err) {
                console.error(err);
                e(err);
            });
            req.write(JSON.stringify(request));
            req.end();
        });
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
        ListPackages: function (params) {
            var dynamodb = IcarusUtil.aws.getDynamoDbClient();
            var table = Config.aws.dynamodb.icarus.table;
            var instanceId = params.InstanceId;
            var r = {
                InstanceId: instanceId,
                Packages: []
            };

            return Q.ninvoke(dynamodb, 'getItem', {
                TableName: table,
                Key: { 'key': { S: 'i#' + instanceId}}
            }).then(function (data) {
                if (data.Item) {
                    if (data.Item.packages && data.Item.packages.SS) {
                        r['Packages'] = data.Item.packages.SS;
                    }
                    return r;
                } else {
                    return Q.ninvoke(dynamodb, 'putItem', {
                        Item: {
                            'key': { S: 'i#' + instanceId},
                            'version': {N: '1'}
                        },
                        TableName: table,
                        Expected: {'key': {Exists: false}}
                    }).then(function (data) {

                        return r;
                    });
                }
            });
        },
        GetServerStates: function (params) {
            if (!params.InstanceIds || params.InstanceIds.length == 0) {
                throw new APISupport.ValidationException("Null or empty instance Ids")
            }
            var ec2 = IcarusUtil.aws.getEc2Client();
            return Q.ninvoke(ec2, 'describeInstances', {InstanceIds: params.InstanceIds})
                .then(function (data) {
                    var instances = [];
                    data.Reservations.forEach(function (reservation) {
                        instances = instances.concat(reservation.Instances);
                    });

                    return Q.all(instances.map(function (instance) {
                        instance['Icarus'] = {};
                        return queryInstance(instance.PublicIpAddress, '/status', {Action: 'GetStatus'})
                            .then(function (data) {
                                instance['Icarus']['Version'] = data.version;
                                return instance;
                            });
                    }));
                });
        }
    };

    router.post('/', APISupport.getActionHandler(ActionHandlers));

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
        if (!params) {
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
})
();
