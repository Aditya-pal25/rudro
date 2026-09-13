const router = require('express').Router();
const ctrl   = require('../controllers/bannerController');
const { protect, admin } = require('../middleware/auth');

// Public
router.get('/active', ctrl.getActiveBanners);

// Admin (all protected by admin-server.js middleware)
router.get('/',         ctrl.getAllBanners);
router.post('/',        ctrl.createBanner);
router.put('/:id',      ctrl.updateBanner);
router.delete('/:id',   ctrl.deleteBanner);
router.patch('/:id/toggle', ctrl.toggleBanner);

module.exports = router;
