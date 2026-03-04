// [최종] Railway 서버(심장)와 Vercel(얼굴)을 하나로 합치는 코드
const socket = io("https://penguin-walkie-production.up.railway.app", {
    reconnection: true,
    reconnectionAttempts: 10, // 10번까지 다시 붙으려고 노력함
    reconnectionDelay: 1000,   // 1초 쉬고 다시 시도
    timeout: 20000,            // 20초 응답 없으면 타임아웃
    transports: ['websocket']  // Railway에서 더 안정적으로 신호를 주고받게 함
}); 

const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const statusText = document.getElementById('status');
const fileInput = document.getElementById('file-input');

// [기능] 사진 임시 보관함
let pendingImage = null;

// [수신] 접속자 수 업데이트
socket.on('user-count', (count) => {
    if (statusText) {
        statusText.innerText = `무전기 연결됨! 🐧 (현재 ${count}명 접속 중)`;
        statusText.style.color = 'blue';
    }
});

// [핵심] 메시지 및 이미지 출력 함수
function addMessage(content, type, isImage = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;

    if (isImage) {
        const img = document.createElement('img');
        img.src = content;
        img.style.maxWidth = "200px"; 
        img.style.display = "block";
        img.style.borderRadius = "10px";
        img.style.marginTop = "5px";

        img.onload = () => {
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        img.onerror = () => {
            msgDiv.innerText = "⚠️ 사진을 불러오지 못했습니다.";
            msgDiv.style.color = "red";
        };

        msgDiv.appendChild(img);
    } else {
        msgDiv.innerText = content;
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// [전송] 통합 핸들러
async function handleSend() {
    const message = userInput.value.trim();

    if (message) {
        addMessage(message, 'user');
        socket.emit('chat-message', { text: message });
        userInput.value = '';
    }

    if (pendingImage) {
        addMessage(pendingImage, 'user', true);
        socket.emit('chat-image', { image: pendingImage });
        pendingImage = null;
        if (statusText) {
            statusText.innerText = `무전기 연결됨! 🐧`;
            statusText.style.color = 'blue';
        }
    }

    if (!message && !pendingImage) return;
}

// [선택] 사진 파일 선택
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        pendingImage = event.target.result; 
        if (statusText) {
            statusText.innerText = "사진 준비 완료! 🖼️ 전송을 눌러주세요.";
            statusText.style.color = "green";
        }
    };
    reader.readAsDataURL(file);
});

// [수신] 데이터 받기
socket.on('chat-message', (data) => { addMessage(data.text, 'ai'); });
socket.on('chat-image', (data) => { addMessage(data.image, 'ai', true); });

// [이벤트 연결]
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

// [상태 표시] 연결 상태 모니터링
socket.on('disconnect', () => {
    if (statusText) {
        statusText.innerText = "🔌 연결 끊김! 재연결 시도 중...";
        statusText.style.color = "red";
    }
});

socket.on('reconnect', () => {
    if (statusText) {
        statusText.innerText = "✅ 재연결 성공!";
        statusText.style.color = "blue";
    }
});