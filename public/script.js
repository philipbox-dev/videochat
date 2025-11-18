const urlParams = new URLSearchParams(window.location.search);
const roomId = window.location.pathname.split('/')[2];
const password = urlParams.get('password');

document.getElementById('roomIdDisplay').textContent = roomId || 'Loading...';

const socket = io();
const peer = new Peer(undefined, {
  host: '0.peerjs.com',
  secure: true,
  port: 443
});
let myStream = null;  // важно: изначально null

const myVideo = document.getElementById('myVideo');
const peerVideo = document.getElementById('peerVideo');
const peerStatus = document.getElementById('peerStatus');

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
  myStream = stream;
  myVideo.srcObject = stream;

  // добавляем треки, чтобы не было чёрного экрана при отключенной камере
  myVideo.play();

  peer.on('open', id => {
    socket.emit('join-room', roomId, password, err => {
      if (err) {
        alert(err);
        window.location = '/';
      }
    });
  });

  peer.on('call', call => {
    call.answer(stream);
    call.on('stream', remoteStream => {
      peerVideo.srcObject = remoteStream;
      peerStatus.style.display = 'none';
      document.getElementById('peerLabel').style.display = 'block';
    });
  });

  socket.on('user-connected', peerId => {
    setTimeout(() => {  // небольшая задержка, чтобы точно соединиться
      const call = peer.call(peerId, stream);
      call.on('stream', remoteStream => {
        peerVideo.srcObject = remoteStream;
        peerStatus.style.display = 'none';
        document.getElementById('peerLabel').style.display = 'block';
      });
    }, 1000);
  });

  socket.on('user-disconnected', () => {
    peerVideo.srcObject = null;
    peerStatus.style.display = 'block';
    document.getElementById('peerLabel').style.display = 'none';
  });

})
.catch(err => {
  console.log(err);
  alert('Не удалось получить доступ к камере/микрофону. Разреши доступ в браузере!');
});

// ================ КНОПКИ С ЗАЩИТОЙ ОТ ДУРАКА ================
document.getElementById('micBtn').onclick = () => {
  if (!myStream) return alert('Камера ещё загружается...');
  const enabled = myStream.getAudioTracks()[0].enabled;
  myStream.getAudioTracks()[0].enabled = !enabled;
  document.getElementById('micBtn').textContent = enabled ? '🎤' : '🔇';
  document.getElementById('micBtn').style.background = enabled ? 'rgba(0,0,0,0.6)' : '#ff3b58';
};

document.getElementById('camBtn').onclick = () => {
  if (!myStream) return alert('Камера ещё загружается...');
  const enabled = myStream.getVideoTracks()[0].enabled;
  myStream.getVideoTracks()[0].enabled = !enabled;
  document.getElementById('camBtn').textContent = enabled ? '📹' : '📹';
  document.getElementById('camBtn').style.background = enabled ? 'rgba(0,0,0,0.6)' : '#ff3b58';
};
// ==========================================================

function copyRoom() {
  navigator.clipboard.writeText(window.location.href);
  const btn = document.querySelector('.copy-btn');
  const old = btn.textContent;
  btn.textContent = '✓ Скопировано!';
  btn.style.background = '#00ff88';
  setTimeout(() => {
    btn.textContent = old;
    btn.style.background = '#ff3b58';
  }, 2000);
}
