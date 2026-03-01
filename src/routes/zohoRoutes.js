const express = require('express');
const router = express.Router();
const zohoController = require('../controllers/zohoController');

router.get('/init', zohoController.initiateOAuth);
router.get('/callback', zohoController.handleCallback);
router.post('/webhook', zohoController.handleWebhook);
router.post('/subscribe', zohoController.subscribeNotifications);

module.exports = router;
