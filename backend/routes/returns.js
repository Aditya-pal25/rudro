const router = require('express').Router();
const ctrl   = require('../controllers/returnController');
const { protect, admin } = require('../middleware/auth');

// Customer routes
router.get('/eligibility', protect, ctrl.checkEligibility);
router.post('/',           protect, ctrl.createRequest);
router.get('/my',          protect, ctrl.getMyRequests);
router.put('/:id/cancel',  protect, ctrl.cancelRequest);

// Admin routes (also protected by admin-server middleware chain)
router.get('/admin/all',        ctrl.adminGetAll);
router.put('/admin/:id/status', ctrl.adminUpdateStatus);
router.get('/admin/summary',    ctrl.getDashboardSummary);

module.exports = router;
