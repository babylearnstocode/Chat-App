const express = require('express');

const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.get('/', viewController.getSignup);
router.get('/signup', viewController.getSignup);
router.patch('/verifySignup/:token', viewController.getMessages);
router.get('/login', viewController.getLogin);

router.get(
  '/messages',
  viewController.redirect,
  authController.protect,
  viewController.getMessages
);

module.exports = router;
