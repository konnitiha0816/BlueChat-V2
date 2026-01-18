const socket = io();
let myNickname = "";
let currentRoom = "";
let myRank = "ブロンズ"; // デフォルト

// 1. 昼夜背景切り替え (JST)
function updateBG() {
    const hour = new Date().getHours();
    document.body.className = (hour >= 5 && hour < 17) ? 'day-bg' : 'night-bg';
}
setInterval(updateBG, 60000); updateBG();

// 2. 音楽プレイヤー
const audioKetsui = new Audio('/sounds/ketsui.mp3');
const audioBattle = new Audio('/sounds/battle.mp3');
audioBattle.loop = true;

// 3. 九九認証
let captchaAns = 0;
function startCaptcha() {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    captchaAns = a * b;
    document.getElementById('captcha-q').innerText = `${a} × ${b} = ?`;
    showScreen('screen-captcha');
}
function checkCaptcha() {
    if (parseInt(document.getElementById('captcha-a').value) === captchaAns) {
        showScreen('screen-login');
    } else {
        alert("不正解です！");
        startCaptcha();
    }
}

// 4. アカウント作成ロジック
function checkReg1() {
    const id = document.getElementById('reg-id').value;
    const pw = document.getElementById('reg-pw').value;
    const idRegex = /^[a-zA-Z0-9.-]+$/;
    if (!idRegex.test(id)) return alert("IDは英数字、ハイフン、ドットのみです");
    if (pw.length < 6) return alert("パスワードは6文字以上必要です");
    
    socket.emit('check-id', id);
    socket.on('check-id-result', (exists) => {
        if (exists) alert("このIDは既に使われています");
        else showScreen('screen-register-2');
    });
}

function doRegister() {
    const id = document.getElementById('reg-id').value;
    const pw = document.getElementById('reg-pw').value;
    const nick = document.getElementById('reg-nick').value;
    socket.emit('register', { id, pw, nickname: nick });
    socket.on('register-success', () => {
        alert("アカウント作成完了！");
        showScreen('screen-login');
    });
}

// 5. 通話開始 (ビデオストリーム取得)
async function startCall() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('main-video').srcObject = stream;
    showScreen('screen-call');
    updateClock();
}

function updateClock() {
    const now = new Date();
    document.getElementById('display-time').innerText = now.toLocaleTimeString('ja-JP');
    setTimeout(updateClock, 1000);
}

function showScreen(id) {
    document.querySelectorAll('body > div').forEach(d => d.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('v-tag').classList.remove('hidden');
}
