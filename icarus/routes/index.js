var express = require('express');
var router = express.Router();
var path = require('path');

(function () {
    'use strict';
    var INDEX_PATH = path.resolve('public/index.html');

    router.get(/^(.*)$/, function (req, res) {
        res.sendFile(INDEX_PATH);
    });
})();

module.exports = router;
