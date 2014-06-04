var Config = require('../../config/config');
var router = express.Router();

(function () {
    'use strict';

    // skip registration if role not configured
    if (!Config.roles.icarus.admin) {
        return;
    }

    router.get('/', function(req,res) {
       res.render('admin/artifact')
    });

    module.exports = router;
})();
