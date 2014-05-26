'use strict';

var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var Config = require('../config/config');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

router.get('/:instanceId', function (req, res) {
    var instanceId = req.params['instanceId'];
    res.render('bootstrap', { instanceId: instanceId});
});

module.exports = router;
