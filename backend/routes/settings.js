const router = require('express').Router();
const ctrl   = require('../controllers/settingsController');

// Public route (for WhatsApp number etc)
router.get('/public', ctrl.getPublicSettings);

// Admin routes (protected by admin-server middleware)
router.get('/',  ctrl.getSettings);
router.put('/',  ctrl.updateSettings);

module.exports = router;
