const router = require('express').Router();
const ctrl = require('../controllers/adminAuthController');

router.post('/login', ctrl.login);
router.get('/me', ctrl.me);

module.exports = router;