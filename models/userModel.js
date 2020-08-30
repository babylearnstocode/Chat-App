const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // id: {
  //   type: mongoose.Schema.Types.ObjectId,

  //   auto: true
  // },
  name: {
    type: String,
    require: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    require: [true, 'Please provide your email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },

  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'manager'],
    default: 'user'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'none'],
    default: 'none'
  },
  genderLookingFor: {
    type: String,
    enum: ['male', 'female', 'both', 'none'],
    default: 'none'
  },
  description: {
    type: String,
    maxlength: 200
  },
  password: {
    type: String,
    require: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    require: [true, 'Please confirm a password'],
    validate: {
      //Must only work on create and save
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  signupToken: String,
  signupExpires: Date,
  active: {
    type: Boolean,
    default: false,
    select: false
  }
});

userSchema.pre('save', async function (next) {
  //Only run this func if password was actually modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;
  next();
});

// userSchema.pre(/^find/, function (next) {
//   // this point to current query
//   this.find({ active: { $ne: false } });
//   next();
// });

//Instances method available on all document on certain collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangeAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );

    return JWTTimeStamp < changeTimeStamp;
  }

  //Not changed
  return false;
};

userSchema.methods.createToken = function (type) {
  //never store plain token in database
  const token = crypto.randomBytes(32).toString('hex');
  const hashToken = crypto.createHash('sha256').update(token).digest('hex');
  if (type === 'signup') {
    this.signupToken = hashToken;
    this.signupExpires = Date.now() + 10 * 60 * 1000;
  } else {
    this.passwordResetToken = hashToken;

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  }

  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
