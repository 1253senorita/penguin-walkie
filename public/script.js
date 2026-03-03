const socket = io(); 

const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const statusText = document.getElementById('status');
const fileInput = document.getElementById('file-input');

// [추가] 사진을 전송 버튼 누르기 전까지 잠시 보관하는 변수
let pendingImage = null;

// [이벤트 수신: 서버 -> 뷰 창] 접속자 수 업데이트
socket.on('user-count', (count) => {
    if (statusText) {
        statusText.innerText = `무전기 연결됨! 🐧 (현재 ${count}명 접속 중)`;
        statusText.style.color = 'blue';
    }
});

// 화면에 메시지/사진을 그리는 핵심 함수
function addMessage(content, type, isImage = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    if (isImage) {
        const img = document.createElement('img');
        img.src = content;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "10px";
        msgDiv.appendChild(img);
    } else {
        msgDiv.innerText = content;
    }
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// [이벤트 실행: 통합 전송] 버튼 클릭 시 호출
async function handleSend() {
    const message = userInput.value.trim();

    // 1. 글자 전송 로직: 글자가 있으면 보냄
    if (message) {
        addMessage(message, 'user');
        socket.emit('chat-message', { text: message });
        userInput.value = ''; // 전송 후 입력창 비우기
    }

    // 2. 사진 전송 로직: 주머니에 사진이 있으면 보냄
    if (pendingImage) {
        addMessage(pendingImage, 'user', true);
        socket.emit('chat-image', { image: pendingImage });
        pendingImage = null; // 전송 완료 후 주머니 비우기
        statusText.innerText = `무전기 연결됨! 🐧`; // 상태 원복
        statusText.style.color = 'blue';
    }

    // 아무것도 입력 안 하고 버튼만 누른 경우 방어
    if (!message && !pendingImage) return;
}

// [이벤트 실행: 사진 선택] 이제 바로 보내지 않고 '보관'만 합니다
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        // [중요] 서버로 바로 쏘지 않고 변수에 저장만 함
        pendingImage = event.target.result; 
        
        // 오빠, 사진을 골랐다는 걸 알 수 있게 상태창을 바꿔줄게요
        statusText.innerText = "사진 준비 완료! 🖼️ 전송을 눌러주세요.";
        statusText.style.color = "green";
    };
    reader.readAsDataURL(file);
});

// [이벤트 수신: 다른 펭귄의 데이터]
socket.on('chat-message', (data) => { addMessage(data.text, 'ai'); });
socket.on('chat-image', (data) => { addMessage(data.image, 'ai', true); });

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });