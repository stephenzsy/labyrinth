var express = require('express');
var router = express.Router();
var IcarusUtil = require('../../lib/util');
var APISupport = require('../api-support');
var Config = require('../../config/config');
var Q = require('q');

module.exports = router;

(function () {
    'use strict';

    // skip registration if role not configured
    if (!Config.roles.icarus.admin) {
        return;
    }

    var Route53ActionHandlers = {
        ListHostedZones: function (params) {
            var route53 = IcarusUtil.aws.getRoute53Client();
            return Q.ninvoke(route53, 'listHostedZones', {})
                .then(function (result) {
                    return result;
                });
        },
        ListResourceRecordSets: function (params) {
            var route53 = IcarusUtil.aws.getRoute53Client();
            return Q.ninvoke(route53, 'listResourceRecordSets', {HostedZoneId: Config.aws.route53.hostedZoneId})
                .then(function (result) {
                    return result;
                });
        }
    };

    var ActionHandlers = {
        ListIcarusResourceRecordSets: function (params) {
            var route53 = IcarusUtil.aws.getRoute53Client();
            return Q.ninvoke(route53, 'listResourceRecordSets', {HostedZoneId: Config.aws.route53.hostedZoneId})
                .then(function (data) {
                    data.ResourceRecordSets.forEach(function (rrs) {
                        if (rrs.Name.match(Config.aws.route53.icarus.resourceRecordSetNamePattern))
                            console.log(rrs);
                    });
                    return data;
                });
        }
    };

    router.post('/', APISupport.getActionHandler(ActionHandlers));
    router.post('/route53', APISupport.getActionHandler(Route53ActionHandlers))

})();
