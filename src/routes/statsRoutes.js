const express = require('express');
const router = express.Router();
const { getStats, addStat, updateStat, deleteStat } = require('../controllers/statsController');
const { protect } = require('../middleware/auth');

router.get('/',       getStats);
router.post('/',      protect, addStat);
router.put('/:id',    protect, updateStat);
router.delete('/:id', protect, deleteStat);

module.exports = router;
