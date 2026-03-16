const express = require('express');
const router  = express.Router();
const { getUsers, createUser, updateUser, deleteUser, forceLogout } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('admin'));

router.route('/').get(getUsers).post(upload.single('avatar'), createUser);
router.route('/:id').put(upload.single('avatar'), updateUser).delete(deleteUser);
router.post('/:id/force-logout', forceLogout);

module.exports = router;
