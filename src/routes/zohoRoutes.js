const express = require('express');
const router = express.Router();
const zohoController = require('../controllers/zohoController');

router.get('/fields', zohoController.getFields);
router.get('/status', zohoController.getStatus);
router.get('/init', zohoController.initiateOAuth);
router.get('/callback', zohoController.handleCallback);
router.post('/webhook', zohoController.handleWebhook);
router.post('/subscribe', zohoController.subscribeNotifications);
router.get('/debug-property/:id', zohoController.debugProperty);
router.post('/sync-property/:id', zohoController.syncProperty);

module.exports = router;
