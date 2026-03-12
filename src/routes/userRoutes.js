const express = require('express');
const router  = express.Router();
const { getUsers, createUser, updateUser, deleteUser, forceLogout } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser);
router.post('/:id/force-logout', forceLogout);

module.exports = router;
