const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/room/:roomId', (req, res) => {
  res.sendFile(__dirname + '/public/room.html');
});

const rooms = {}; // { roomId: { password: "xxx", users: [] } }

io.on('connection', socket => {
  socket.on('create-room', (password, callback) => {
    const roomId = uuidV4();
    rooms[roomId] = { password, users: [] };
    callback(roomId);
  });

  socket.on('join-room', (roomId, password, callback) => {
    if (!rooms[roomId]) {
      return callback('Room does not exist');
    }
    if (rooms[roomId].password !== password) {
      return callback('Wrong password');
    }

    socket.join(roomId);
    rooms[roomId].users.push(socket.id);
    
    socket.to(roomId).emit('user-connected', socket.id);
    
    callback(null, roomId);

    socket.on('disconnect', () => {
      if (rooms[roomId]) {
        rooms[roomId].users = rooms[roomId].users.filter(id => id !== socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
        if (rooms[roomId].users.length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});