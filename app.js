const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');

const userRouter = require('./routes/userRouter');
const messageRouter = require('./routes/messageRouter');
const viewRouter = require('./routes/viewRouter');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/public/index.html');
// });

app.use(compression());
// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parse, reading data from body into req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/messages', messageRouter);
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
