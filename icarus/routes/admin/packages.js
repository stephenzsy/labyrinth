var Config = require('../../config/config');
var express = require('express');
var router = express.Router();

(function () {
    'use strict';

    // skip registration if role not configured
    if (!Config.roles.icarus.admin) {
        return;
    }

})();

module.exports = router;
