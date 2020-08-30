const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

exports.createMessage = factory.createOne(Message);
exports.getAllMessages = factory.getAll(Message);
exports.getOneMessage = factory.getOne(Message);
exports.updateMessage = factory.updateOne(Message);
exports.deleteMessage = factory.deleteOne(Message);

exports.getMyMessages = catchAsync(async (req, res, next) => {
  const user = req.user.id;
  if (!user) {
    next(new AppError('You are not authorized to perform this action.'), 400);
  }
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { sendTo: mongoose.Types.ObjectId(`${user}`) },
          { sender: mongoose.Types.ObjectId(`${user}`) }
        ]
      }
    }
  ]);

  await User.populate(messages, {
    path: '_id',
    select: { _id: 1, name: 1, photo: 1 }
  });

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: messages
  });
});

exports.getMyMessagesWith = catchAsync(async (req, res, next) => {
  const currentUser = req.user.id;
  const contact = req.params.id;
  if (!currentUser) {
    next(new AppError('You are not authorized to perform this action.'), 400);
  }
  const messages = await Message.find({
    $or: [
      { sender: currentUser, sendTo: contact },
      { sender: contact, sendTo: currentUser }
    ]
  }).sort({ created_at: -1 });

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: messages
  });
});

exports.createMessageWith = catchAsync(async (req, res, next) => {
  const sender = req.user.id;
  const { message } = req.body;
  const sendTo = req.params.id;
  if (!sender) {
    next(new AppError('You are not authorized to perform this action.'), 400);
  }
  const newMessage = await Message.create({
    message,
    sender,
    sendTo
  });

  await User.populate(newMessage, {
    path: 'sender',
    select: 'name photo'
  });
  await User.populate(newMessage, {
    path: 'sendTo',
    select: 'name photo'
  });

  let conversation1 = await Conversation.findOne({
    user1: sender,
    user2: sendTo
  });
  let conversation2 = await Conversation.findOne({
    user1: sendTo,
    user2: sender
  });

  let newConversation;
  if (conversation1) {
    await Conversation.updateOne(
      { _id: conversation1.id },
      {
        $set: {
          message: newMessage.message
        }
      }
    );
  } else if (conversation2) {
    await Conversation.updateOne(
      { _id: conversation2.id },
      {
        $set: {
          message: newMessage.message
        }
      }
    );
  } else {
    newConversation = true;
    await Conversation.create({
      message: newMessage.message,
      user1: sender,
      user2: sendTo
    });
  }

  res.status(200).json({
    status: 'success',
    data: newMessage
  });
});

exports.getAllConversations = catchAsync(async (req, res, next) => {
  const user = req.user.id;
  const conversations = await Conversation.find({
    $or: [{ user1: user }, { user2: user }]
  }).sort({ updated_at: -1 });

  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: conversations
  });
});
