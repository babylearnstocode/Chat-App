const server = require('./server');
const socket = require('socket.io');

//Socket setup
const io = socket(server);

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    io.emit('disconnect', 'user disconnected');
    // console.log('user disconnected');
  });

  socket.on('chat message from client', (room, msg) => {
    socket.join(room);
    io.to(room).emit('chat message from server', msg);
  });

  socket.on('new user connected', (receiver) => {
    io.emit('new user connected', `User ${receiver} connected`);
  });
});
