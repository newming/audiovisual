function MusicVisualizer(obj) {
  this.source = null;
  this.count = 0;
  // 创建分析节点
  this.analyser = MusicVisualizer.ac.createAnalyser()
  this.size = obj.size || 128;
  // 这个是数组每一项的最大的值，size是关系到横坐标的柱状图的数量，就是分析数据的数组长度
  this.analyser.fftSize = this.size * 2;
  // 创建控制音量节点
  this.gainNode = MusicVisualizer.ac[MusicVisualizer.ac.createGain?'createGain':'createGainNode']();
  // 连接到播放设备
  this.gainNode.connect(MusicVisualizer.ac.destination);

  // 将分析对象连接到音量对象
  this.analyser.connect(this.gainNode);

  // XML 对象
  this.xhr = new XMLHttpRequest();
  // 绘图
  this.visualizer = obj.visualizer;
  // 获取音频频域，不断执行动画函数
  this.visualize()
}

MusicVisualizer.ac = new (window.AudioContext || window.webkitAudioContext)();

MusicVisualizer.prototype.load = function (url, fun) {
  // 每次请求时先终止上个请求
  this.xhr.abort();
  this.xhr.open('GET', url);
  this.xhr.responseType = 'arraybuffer';
  var self = this;
  this.xhr.onload = function () {
    fun(self.xhr.response);
  }
  this.xhr.send()
}

MusicVisualizer.prototype.decode = function (arraybuffer, fun) {
  MusicVisualizer.ac.decodeAudioData(arraybuffer, function (buffer) {
    fun(buffer)
  },function (err) {
    console.log(err);
  })
}

MusicVisualizer.prototype.play = function (url) {
  // 避免多首同时播放做的计数
  var n = ++ this.count;
  var self = this;
  this.source && this.stop();

  this.load(url, function (arraybuffer) {
    if (n !== self.count) return;
    self.decode(arraybuffer, function (buffer) {
      // 创建buffersource对象
      var bs = MusicVisualizer.ac.createBufferSource();
      bs.connect(self.analyser)
      bs.buffer = buffer;
      bs[bs.start ? 'start' : 'noteOn'](0);
      self.source = bs;
    })
  })
};

// 停止音乐播放
MusicVisualizer.prototype.stop = function () {
  this.source[this.source.stop ? 'stop' : 'noteOff']()
}

// 控制音量
MusicVisualizer.prototype.changeVolume = function (percent) {
  this.gainNode.gain.value = percent;
}

// 可视化效果
MusicVisualizer.prototype.visualize = function () {
  var arr = new Uint8Array(this.analyser.frequencyBinCount);// [0,0,0,...256个]
  //实时拿到频域
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame; // 相当于setTimeout

  var self = this;
  function v() {
    console.log('aaa');
    self.analyser.getByteFrequencyData(arr);// 将拿到的音频频域复制到数组中
    // console.log(arr);// [128位0～255的数]
    self.visualizer(arr);
    ani = requestAnimationFrame(v)
  }
  ani = requestAnimationFrame(v)
}
