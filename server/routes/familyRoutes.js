const express = require("express");
const router = express.Router();
const {
    getMyFamily,
    joinFamily,
    removeMember,
    makeAdmin
} = require('../controllers/familyController');
const  { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/my-family', protect, getMyFamily);
router.post('/join', protect, joinFamily);
router.delete('/members/:userId', protect, adminOnly, removeMember);
router.put('/members/:userId/make-admin', protect, adminOnly, makeAdmin);

module.exports = router;