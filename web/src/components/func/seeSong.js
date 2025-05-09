const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d');
const audioEle = document.querySelector('audio');
const cvs = document.getElementById('myCanvas');

// 初始化
function initCvs() {
    cvs.width = window.innerWidth * devicePixelRatio;
    cvs.height = (window.innerWidth / 2) * devicePixelRatio;
}

initCvs();

let isInit = false;
let dataArray, analyser;

audioEle.onplay = function () {
    if (isInit) {
        return;
    }

    const audCtx = new AudioContext();
    const source = audCtx.createMediaElementSource(audioEle);
    analyser = audCtx.createAnalyser();
    analyser.connect(audCtx.destination);
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audCtx.destination);

    isInit = true;
}

function draw() {
    requestAnimationFrame(draw);
    const {width, height} = cvs;
    ctx.clearRect(0, 0, width, height);
    if (!isInit) {
        return;
    }
    analyser.getByteFrequencyData(dataArray);
    const len = dataArray.length;
    const barWidth = width / len;
    ctx.fillStyle = '#78C5F7';
    for (let i = 0; i < len; i++) {
        const data = dataArray[i];
        const barHeight = data / 255 * height;
        const x = i * barWidth;
        const y = height - barHeight;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
}

draw();