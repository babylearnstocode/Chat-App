const express = require('express');

const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.get('/', viewController.getSignup);
router.get('/signup', viewController.getSignup);
// router.patch('/verifySignup/:token', authController.verifySignup);
router.get('/login', viewController.getLogin);

router.get(
  '/messages',
  viewController.redirect,
  authController.protect,
  viewController.getMessages
);

// router.post(
//   '/forgotPassword',
//   authController.forgotPassword
// );
// router.patch(
//   '/resetPassword/:token',
//   authController.resetPassword
// );

//Protect all routes after this middleware
// router.use(authController.protect);

// router.patch('/updatePassword', authController.updatePassword);

// router.patch('/updateMe', userController.updateMe);

// router.delete('/deleteMe', userController.deleteMe);

// router.get('/me', userController.getMe, userController.getUser);

// //Only admins have permission to perform these actions

// router.use(authController.restrictTo('admin'));

// router
//   .route('/')
//   .get(userController.getAllUsers)
//   .post(userController.createUser);

// router
//   .route('/:id')
//   .get(userController.getUser)
//   .patch(userController.updateUser)
//   .delete(userController.deleteUser);

module.exports = router;
