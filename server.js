const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.static('public')); 

const server = http.createServer(app);

// [설정] 10MB 용량 및 연결 유지 최적화
const io = new Server(server, {
  maxHttpBufferSize: 1e7,
  pingTimeout: 30000,
  pingInterval: 10000,
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"] 
  }
});

let userCount = 0;
let chatHistory = []; 
const lastMessageTime = new Map(); // 도배 방지용 메모리

io.on('connection', (socket) => {
  // 1. 접속 처리 및 인원수 업데이트
  userCount++;
  console.log(`🐧 펭귄 접속! 현재: ${userCount}마리 (ID: ${socket.id})`);
  io.emit('user-count', userCount);

  // 2. [옵저버] 이전 기록 즉시 로드 (최근 30개)
  socket.emit('load-history', chatHistory);

  // [핵심 로직] 데이터 처리 및 저장 함수
  const handleData = (type, data, callback) => {
    const now = Date.now();
    const lastTime = lastMessageTime.get(socket.id) || 0;

    // 도배 방지 (0.5초 간격 제한)
    if (now - lastTime < 500) {
      if(callback) callback({ status: 'error', message: '너무 빨라요!' });
      return;
    }
    lastMessageTime.set(socket.id, now);

    // 기록 저장 (id 부여 및 히스토리 관리)
    const msgData = { ...data, id: now, type: type };
    chatHistory.push(msgData);
    if(chatHistory.length > 30) chatHistory.shift();

    // 나를 제외한 모두에게 브로드캐스트
    const eventName = type === 'text' ? 'chat-message' : 'chat-image';
    socket.broadcast.emit(eventName, data);
    
    if(callback) callback({ status: 'ok' });
  };

  // 3. 문자/사진 이벤트 연결
  socket.on('chat-message', (data, callback) => handleData('text', data, callback));
  socket.on('chat-image', (data, callback) => handleData('image', data, callback));

  // 4. [음성 무전] 실시간 중계 (음성은 기록 저장 안 함)
  socket.on('voice-chunk', (data) => {
    socket.broadcast.emit('play-voice', data);
  });

  // 5. 퇴장 처리
  socket.on('disconnect', (reason) => {
    if (userCount > 0) userCount--;
    console.log(`👋 펭귄 퇴장! 현재: ${userCount}마리 (사유: ${reason})`);
    io.emit('user-count', userCount);
    lastMessageTime.delete(socket.id);
  });
});

// [중요] Railway 배포를 위해 0.0.0.0 주소와 포트 설정 필수
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Railway 펭귄 중계소 가동 중: 포트 ${PORT}`);
});