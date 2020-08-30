// review / rating / createdAt / ref to tour / to user
const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Write something']
    },

    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Conversation must have a user1']
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Conversation must have a user2.']
    }
  },
  { timestamps: { updatedAt: 'updated_at' } },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ConversationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user1',
    select: 'name photo'
  }).populate({
    path: 'user2',
    select: 'name photo'
  });

  next();
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;
