// review / rating / createdAt / ref to tour / to user
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Write something']
    },

    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender']
    },
    sendTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a recevier.']
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sender',
    select: 'name photo'
  }).populate({
    path: 'sendTo',
    select: 'name photo'
  });
  next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
