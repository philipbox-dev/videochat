const urlParams = new URLSearchParams(window.location.search);
const roomId = window.location.pathname.split('/')[2];
const password = urlParams.get('password');

document.getElementById('roomIdDisplay').textContent = roomId;

const socket = io();
const peer = new Peer();

let myStream;
let myPeerId;
let peerStream;

const myVideo = document.getElementById('myVideo');
const peerVideo = document.getElementById('peerVideo');
const peerStatus = document.getElementById('peerStatus');

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    myStream = stream;
    myVideo.srcObject = stream;

    peer.on('open', id => {
      myPeerId = id;
      socket.emit('join-room', roomId, password, (err) => {
        if (err) {
          alert(err);
          window.location = '/';
        }
      });
    });

    peer.on('call', call => {
      call.answer(stream);
      call.on('stream', remoteStream => {
        peerStream = remoteStream;
        peerVideo.srcObject = remoteStream;
        peerStatus.style.display = 'none';
      });
    });

    socket.on('user-connected', peerId => {
      const call = peer.call(peerId, stream);
      call.on('stream', remoteStream => {
        peerStream = remoteStream;
        peerVideo.srcObject = remoteStream;
        peerStatus.style.display = 'none';
      });
    });

    socket.on('user-disconnected', () => {
      peerVideo.srcObject = null;
      peerStatus.style.display = 'block';
      peerStatus.textContent = "Person left. Waiting for someone...";
    });
  });

document.getElementById('micBtn').onclick = () => {
  const enabled = myStream.getAudioTracks()[0].enabled;
  myStream.getAudioTracks()[0].enabled = !enabled;
  document.getElementById('micBtn').textContent = enabled ? '🎤 Mic On' : '🔇 Mic Off';
};

document.getElementById('camBtn').onclick = () => {
  const enabled = myStream.getVideoTracks()[0].enabled;
  myStream.getVideoTracks()[0].enabled = !enabled;
  document.getElementById('camBtn').textContent = enabled ? '📹 Cam On' : '📹 Cam Off';
};

function copyRoom() {
  navigator.clipboard.writeText(window.location.href);
  const btn = document.querySelector('.copy-btn');
  const old = btn.textContent;
  btn.textContent = '✓ Copied!';
  setTimeout(() => btn.textContent = old, 2000);
}
