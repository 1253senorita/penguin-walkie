const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); 

// [수정] 오빠가 파일을 밖으로 꺼냈을 때를 대비해 현재 폴더(.)도 읽게 설정
app.use(express.static('.')); 
app.use(express.static('public')); 

const server = http.createServer(app);

// [설정] 10MB 용량 및 연결 유지 최적화
const io = new Server(server, {
  maxHttpBufferSize: 1e7, // 10MB 허용
  pingTimeout: 30000,
  pingInterval: 10000,
  cors: { 
    origin: "*", // 모든 기기(휴대폰) 접속 허용
    methods: ["GET", "POST"] 
  }
});

let userCount = 0;
let chatHistory = []; 
const lastMessageTime = new Map();

io.on('connection', (socket) => {
  userCount++;
  console.log(`🐧 펭귄 접속! 현재: ${userCount}마리 (ID: ${socket.id})`);
  io.emit('user-count', userCount);

  socket.emit('load-history', chatHistory);

  const handleData = (type, data, callback) => {
    const now = Date.now();
    const lastTime = lastMessageTime.get(socket.id) || 0;

    if (now - lastTime < 500) {
      if(callback) callback({ status: 'error', message: '너무 빨라요!' });
      return;
    }
    lastMessageTime.set(socket.id, now);

    const msgData = { ...data, id: now, type: type };
    chatHistory.push(msgData);
    if(chatHistory.length > 30) chatHistory.shift();

    const eventName = type === 'text' ? 'chat-message' : 'chat-image';
    socket.broadcast.emit(eventName, data);
    
    if(callback) callback({ status: 'ok' });
  };

  socket.on('chat-message', (data, callback) => handleData('text', data, callback));
  socket.on('chat-image', (data, callback) => handleData('image', data, callback));

  socket.on('voice-chunk', (data) => {
    socket.broadcast.emit('play-voice', data);
  });

  socket.on('disconnect', (reason) => {
    if (userCount > 0) userCount--;
    console.log(`👋 펭귄 퇴장! 현재: ${userCount}마리 (사유: ${reason})`);
    io.emit('user-count', userCount);
    lastMessageTime.delete(socket.id);
  });
});

// [중요] Railway 배포 설정
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Railway 펭귄 중계소 가동 중: 포트 ${PORT}`);
});