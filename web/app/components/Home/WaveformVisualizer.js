// WaveformVisualizer.js
export const createWaveformVisualizer = (audioRef, waveformRef) => {
  if (!audioRef.current) return; // 如果音频元素不存在，直接返回

  const audio = audioRef.current;
  const waveform = waveformRef.current;
  const audioContext = new AudioContext();
  let analyser = null; // 声明为局部变量

  function createAnalyserNode() {
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  if (!audio.sourceNode) { // 如果音频元素未连接到 sourceNode，创建新的分析节点
    createAnalyserNode();
    audio.sourceNode = analyser;
  } else { // 如果音频元素已经连接到 sourceNode，则直接使用已有的分析节点
    analyser = audio.sourceNode;
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const canvasCtx = waveform.getContext('2d');

  function draw() {
    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, waveform.width, waveform.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    const sliceWidth = waveform.width * 1.0 / bufferLength;
    let x = 0;

    for(let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * waveform.height/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(waveform.width, waveform.height/2);
    canvasCtx.stroke();
  }

  draw();
};