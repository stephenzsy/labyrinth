(function () {
    'use strict';

    var app = angular.module('icarus');

    app.controller('adminDnsController', function ($scope, $AdminDns) {
        $AdminDns.ListIcarusResourceRecordSets().success(function (data) {
            console.log(data)
        });
    });

    app.service('$AdminDns', function ($http) {
        function request(params) {
            return $http({method: 'POST', url: '/admin/dns', data: params});
        }

        return {
            request: request,
            route53Request: function (params) {
                return $http({method: 'POST', url: '/admin/dns/route53', data: params})
            },
            ListIcarusResourceRecordSets: function () {
                return request({Action: 'ListIcarusResourceRecordSets'})
            }
        }
    });

})();
