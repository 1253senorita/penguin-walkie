const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.static('public')); 

const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 30000,
  pingInterval: 10000,
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  console.log('🐧 새로운 펭귄 접속:', socket.id);

  // [기존 무전 로직]
  socket.on('voice-chunk', (data) => {
    socket.broadcast.emit('play-voice', data);
  });

  // [추가: 채팅 로직] - 오빠, 이것만 추가했어요!
  socket.on('chat-message', (data) => {
    socket.broadcast.emit('chat-message', data);
  });

  socket.on('disconnect', (reason) => {
    console.log(`👋 펭귄 나감 (${reason})`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 보미 무전 중계소 가동 중: 포트 ${PORT}`);
});