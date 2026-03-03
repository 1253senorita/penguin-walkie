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

let userCount = 0; // [주체적 수정] 접속자 수 관리 변수

io.on('connection', (socket) => {
  // [실행 부분] 새로운 펭귄이 접속했을 때
  userCount++;
  console.log(`🐧 펭귄 접속! 현재: ${userCount}마리 (ID: ${socket.id})`);
  io.emit('user-count', userCount); // 모든 뷰 창에 인원수 전송

  // [데이터 전송 정의: 문자]
  socket.on('chat-message', (data) => {
    socket.broadcast.emit('chat-message', data);
  });

  // [데이터 전송 정의: 사진]
  socket.on('chat-image', (data) => {
    socket.broadcast.emit('chat-image', data);
  });

  // [데이터 전송 정의: 음성]
  socket.on('voice-chunk', (data) => {
    socket.broadcast.emit('play-voice', data);
  });

  // [실행 부분] 펭귄이 나갔을 때 (초기화 핵심)
  socket.on('disconnect', (reason) => {
    if (userCount > 0) userCount--; // 숫자 깎기
    console.log(`👋 펭귄 퇴장! 현재: ${userCount}마리 (사유: ${reason})`);
    io.emit('user-count', userCount); // 바뀐 숫자를 즉시 알림
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 보미 무전 중계소 가동 중: 포트 ${PORT}`);
});