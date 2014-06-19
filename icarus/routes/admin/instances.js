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


    router.post('/ec2/DescribeImages', function (req, res) {
        var instanceIds = req.body.InstanceIds;
        var ec2 = IcarusUtil.aws.getEc2Client();
        ec2.describeImages({Owners: ['self']}, function (err, data) {
            if (err) {
                res.send(400, err);
                return;
            }
            res.send(data);
        });
    });
})();