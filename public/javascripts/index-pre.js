function $(s) {
  return document.querySelectorAll(s);
}

var lis = $('#list li');
var box = $('#box')[0];
var height,width;
var size = 128; // 所画柱状图的数量

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
box.appendChild(canvas);
var Dots = []; // 所画的圆点

// 产生m-n的随机数
function random(m, n) {
  return Math.round(Math.random()*(n-m) + m)
}

// 产生圆
function getDots() {
  Dots = []
  for (var i = 0; i < size; i++) {
    var x = random(0, width);
    var y = random(0, height);
    var color = 'rgb('+random(0,255)+','+random(0,255)+','+random(0,255)+')';
    Dots.push({
      x:x,
      y:y,
      color: color
    })
  }
}
var line;// 描述画柱状图的属性，因为这个是固定的，所以不往draw函数里写，避免每次执行，但是点击了圆型之后这个形状被改变，需要每次画的时候去看下该画什么形状；
function resize() {
  height = box.clientHeight;
  width = box.clientWidth;
  canvas.height = height;
  canvas.width = width;
  // 画的柱状图的样式
  line = ctx.createLinearGradient(0, 0, 0, height);
  line.addColorStop(0, 'red');
  line.addColorStop(0.5, 'yellow');
  line.addColorStop(1, 'green');

  getDots();
}
resize();
window.onresize = resize;

// canvas 绘图
function draw(arr) {
  ctx.clearRect(0, 0, width, height)
  var w = width / size;
  for (var i = 0; i < size; i++) {
    if (draw.type === 'column') {
      ctx.fillStyle = line; // 画柱状图
      var h = arr[i] / 256 * height;
      ctx.fillRect(w*i, height - h,w*0.6, h);
    }else if (draw.type === 'dot') {
      ctx.beginPath();
      var o = Dots[i];
      var r = arr[i] / 256 * 50;// 圆的半径，最大为50
      ctx.arc(o.x, o.y, r, 0, Math.PI*2, true)
      var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
      g.addColorStop(0, '#fff');
      g.addColorStop(1, o.color);
      ctx.fillStyle = g;
      ctx.fill()
    }
  }
}
draw.type = 'column'; // 当前显示类型
// 类型选择
var types = $('#type li');
for (var i = 0; i < types.length; i++) {
  types[i].onclick = function () {
    for (var j = 0; j < types.length; j++) {
      types[j].className = '';
    }
    this.className = 'selected';
    draw.type = this.getAttribute('data-type');
  }
}

// 绑定单击歌曲名称事件，发ajax请求
for (var i = 0; i < lis.length; i++) {
  lis[i].onclick = function () {
    for (var j = 0; j < lis.length; j++) {
      lis[j].className = '';
    }
    this.className = 'selected';
    // console.log(this.title);
    load('/media/'+this.title)
  }
}

var xhr = new XMLHttpRequest();
var ac = new (window.AudioContext || window.webkitAudioContext)();
// 控制音频音量对象，连接到播放设备
var gainNode = ac[ac.createGain?'createGain':'createGainNode']();// 音量调节用的
gainNode.connect(ac.destination)

var analyser = ac.createAnalyser();//分析对象
analyser.fftSize = size * 2;//每次拿到的数据是fftSize的一半
analyser.connect(gainNode);
// console.log(analyser);
var source = null;
var count = 0;
var ani; // 计时器对象
// 取消动画兼容，这里我用的是这个函数和老师做法不一样，参考https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame
cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame ||  window.webkitCancelRequestAnimationFrame || mozCancelAnimationFrame;

function load(url) {
  // 解决播放bug,点击多首歌曲会同时播放好几首。
  var n = ++count
  source && source[source.stop ? 'stop' : 'noteOff']();
  xhr.abort(); //终止上一个ajax请求

  // 取消上个动画
  if (ani) cancelAnimationFrame(ani);

  xhr.open('GET', url);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function () {
    if (n !== count) return; //解决连续快速点击同时播放问题。因为这个方法是异步的操作，所以连续快速点击可能会出现上一次点击的时候还没有执行onload方法，这样就没有给source赋值，不会停止上一次的点击。利用外部申明一个count,每次点击都会让函数内的n和count+1，注意count是全局的，如果连续快速点击，可能上一次的点击还是等于它当时等于的count值，当它还没有执行到onload方法时，如果再有一个点击，全局的count就会加一，这样就不需要再去请求资源了，否则就多个播放了。
    // 请求成功后
    // console.log(xhr.response);
    ac.decodeAudioData(xhr.response, function (buffer) {
      if (n !== count) return;
      var bufferSource = ac.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.connect(analyser);
      // bufferSource.connect(gainNode);//e你也不需要了bufferSource连接到了analyser上，analyser又连接到了gainNode上
      // bufferSource.connect(ac.destination); //将音频源连接到设备上，因为gainNode已经连接过了，就不需要了
      bufferSource[bufferSource.start? 'start' : 'noteOn'](0);
      source = bufferSource;
      visualizer() //拿到音频的频域，但是这样会有个问题，就是切换歌曲的时候会启动多个计时器，需要做一个取消上个的计时器功能，和老师做法不一样
    },function (err) {
      console.log(err);
    })
  }
  xhr.send()
}

// 根据analyser得到音频频域
function visualizer() {
  var arr = new Uint8Array(analyser.frequencyBinCount);// [0,0,0,...256个]
  //analyser.getByteFrequencyData(arr);// 将拿到的音频频域复制到数组中
  // console.log(arr);// [256位0～255的数]
  //实时拿到频域
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame; // 相当于setTimeout

  function v() {
    analyser.getByteFrequencyData(arr);// 将拿到的音频频域复制到数组中
    // console.log(arr);// [256位0～255的数]
    draw(arr);
    ani = requestAnimationFrame(v)
  }
  ani = requestAnimationFrame(v)
}

//根据gainNode来调节音量大小
function changeVolume(percent) {
  gainNode.gain.value = percent;
  // console.log(percent);
}

$('#volume')[0].onchange = function () {
  changeVolume(this.value/this.max);
}
