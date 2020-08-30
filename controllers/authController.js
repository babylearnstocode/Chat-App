const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_TOKEN, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  //remove the password form the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  //1) check if the email exists and the user is already activated
  const user = await User.findOne({
    email: req.body.email
  }).select('+active');

  if (user && user.active === true) {
    return next(new AppError('This user already registered.'), 400);
  }

  // 2) If not, create new user
  let newUser = await User.create(req.body);

  // 3) Find the user based on email
  newUser = await User.findOne({
    email: req.body.email
  });

  // 4) Generate the random reset token
  const verifyToken = newUser.createToken('signup');
  await newUser.save({ validateBeforeSave: false });

  // 5) Send it to user's mail
  try {
    const verifyURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/verifySignup/${verifyToken}`;
    await new Email(newUser, verifyURL).sendSignupVerification();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.signupToken = undefined;
    user.signupExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. Try again later!', 500)
    );
  }
});

exports.verifySignup = catchAsync(async (req, res, next) => {
  //1 Get user based on the token
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    signupToken: hashToken,
    signupExpires: { $gt: Date.now() }
  }).select('+active');

  //2 if token has not expired, and there is user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 404));
  }

  user.signupToken = undefined;
  user.signupExpires = undefined;
  user.active = true;
  //anything relate to user or password, use save()
  await user.save();

  await User.deleteMany({ email: user.email, active: false });

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(user, url).sendWelcome();
  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1 Check email and pw exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //2 Check if the user exist, check if the password is correct and check if the user is activated
  const user = await User.findOne({ email }).select('+password +active');

  if (
    !user ||
    !user.active ||
    !(await user.correctPassword(password, user.password))
  ) {
    return next(
      new AppError(
        'Incorrect email or password or the user is not activated',
        401
      )
    );
  }

  //3 If everything ok , send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // authen users also by req.cookies send via browser not just req.header
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in!', 401));
  }

  //2) Validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_TOKEN);

  //3 Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  //4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed Password', 401));
  }

  req.user = currentUser;
  //for pug templates
  res.locals.user = currentUser;

  // Grand Access
  next();
});

//Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  // 1) Verify the token
  if (req.cookies.jwt) {
    try {
      // authen users also by req.cookies send via browser not just req.header
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_TOKEN
      );

      //3 Check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //There is logged in user
      req.user = currentUser;
      res.locals.user = currentUser;
      // Grand Access
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin','manager','user], default = 'user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get User base on POSTed email
  const user = await User.findOne({
    email: req.body.email
  });

  if (!user) {
    return next(new AppError('There is no user with that email', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createToken('password');
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's mail

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. Try again later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 Get user based on the token
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2 if token has not expired, and there is user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 404));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //anything relate to user or password, use save()
  await user.save();

  //3 update changedPasswordAt property for the user

  //4 Log the user in, send the JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('There is no user with that email', 404));
  }

  //2 Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError(
        'Invalid password. Please provide the correct current password.'
      ),
      401
    );
  }

  //3 If the is correct, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4 Log user in, send JWT
  createSendToken(user, 200, res);
});
