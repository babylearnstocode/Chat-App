const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Conversation = require('../models/conversationModel');

exports.getLogin = (req, res) => {
  if (req.user) {
    res.redirect('/messages');
  }
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getSignup = (req, res) => {
  if (req.user) {
    res.redirect('/messages');
  }
  res.status(200).render('signup', {
    title: 'Sign up'
  });
};

exports.getMessages = catchAsync(async (req, res, next) => {
  const user = req.user.id;

  if (!user) {
    next(
      new AppError(
        'Please provide a user. You are not authorized to perform this action..'
      ),
      400
    );
  }
  const conversations = await Conversation.find({
    $or: [{ user1: user }, { user2: user }]
  }).sort({ updated_at: -1 });

  res.status(200).render('main', {
    results: conversations.length,
    conversations
  });
});

exports.redirect = (req, res, next) => {
  if (!req.user) {
    res.redirect('/');
  }
  next();
};
