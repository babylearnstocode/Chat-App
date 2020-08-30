const express = require('express');

const messageController = require('../controllers/messageController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/').get(messageController.getMyMessages);
router.get('/conversations', messageController.getAllConversations);
router
  .route('/with/:id')
  .get(messageController.getMyMessagesWith)
  .post(messageController.createMessageWith);

// router
//   .route('/:id')
//   .patch(messageController.updateMyMessage)
//   .delete(messageController.deleteMyMessage);

//only admins have access to these routes
router.use(authController.restrictTo('admin'));
router
  .route('/admin')
  .get(messageController.getAllMessages)
  .post(messageController.createMessage);
router
  .route('/admin/:id')
  .get(messageController.getOneMessage)
  .patch(messageController.updateMessage)
  .delete(messageController.deleteMessage);

module.exports = router;
