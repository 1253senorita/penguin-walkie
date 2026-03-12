// 🐻 Wiki-Router 전용: BEAR-Talkie 모듈 로직
// 불필요한 서버 생성(express, http) 코드를 제거하고 io 객체만 받아서 작동하게 변경함

module.exports = function(io) {
    // 접속 중인 피어 ID 저장소 (전역 관리)
    let peerList = new Set();

    io.on('connection', (socket) => {
        let currentPeerId = null;

        // 📡 [REG] 피어 ID 등록
        socket.on('register-peer', (id) => {
            currentPeerId = id;
            peerList.add(id);
            console.log(`📡 [BEAR-MOD] Peer Registered: ${id}`);
        });

        // 📢 [LIST] 접속자 목록 요청 시 전달
        socket.on('get-peers', () => {
            // 본인을 제외한 리스트만 보낼 수도 있지만, 원본 로직을 존중하여 전체 전달
            socket.emit('peer-list', Array.from(peerList));
        });

        // ❌ [OUT] 접속 종료 시 처리
        socket.on('disconnect', () => {
            if (currentPeerId) {
                peerList.delete(currentPeerId);
                console.log(`❌ [BEAR-MOD] Peer Removed: ${currentPeerId}`);
            }
        });
    });
};