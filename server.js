const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// [Model] 현재 누가 말하고 있는지 상태 저장
let currentSpeaker = null;

io.on('connection', (socket) => {
  console.log('🐧 새로운 펭귄 접속:', socket.id);

  // [Controller] 1. 누군가 버튼을 눌렀을 때
  socket.on('start-talking', () => {
    currentSpeaker = socket.id;
    console.log(`🎤 [${socket.id}] 펭귄이 무전기 버튼을 눌렀어!`);
    
    // 나를 제외한 모든 펭귄에게 "누군가 말하고 있다"고 알려줌 (View 업데이트용)
    socket.broadcast.emit('status-update', { 
      isTalking: true, 
      speaker: '다른 펭귄' 
    });
  });

  // [Controller] 2. 누군가 버튼에서 손을 뗐을 때 (추가된 부분!)
  socket.on('stop-talking', () => {
    console.log(`📴 [${socket.id}] 펭귄이 무전을 마쳤어.`);
    currentSpeaker = null;
    
    // 모든 펭귄에게 "이제 아무도 안 말한다"고 알려줌
    io.emit('status-update', { 
      isTalking: false, 
      speaker: null 
    });
  });

  socket.on('disconnect', () => {
    console.log('👋 펭귄 나감');
    if (currentSpeaker === socket.id) currentSpeaker = null;
  });
});

// 포트 3000번 사용
server.listen(3000, () => {
  console.log('🚀 [System] 보미 무전 중계소 V2 가동 중: http://localhost:3000');
});