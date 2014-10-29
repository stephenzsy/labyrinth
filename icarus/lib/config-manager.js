/**
 * Manages bare-metal-config
 */
'use strict';

module.exports = new (function () {

    var bareConfig = require('../config/bare-metal-config.json');

    this.getConfig = function (key) {
        return bareConfig[key];
    };
})();
