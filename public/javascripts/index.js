// 定义一个全局获取元素节点的方法，类似jquery
function $(s) {
  return document.querySelectorAll(s);
}

var lis = $('#list li');
var box = $('#box')[0];
var height,width;
var size = 64; // 所画柱状图的数量

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
box.appendChild(canvas);
var Dots = []; // 所画的圆点
var line;// 描述画柱状图的属性，因为这个是固定的，所以不往draw函数里写，避免每次执行，但是点击了圆型之后这个形状被改变，需要每次画的时候去看下该画什么形状；

var mv = new MusicVisualizer({
  size: size,
  visualizer: draw
})

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
    var color = 'rgba('+random(0,255)+','+random(0,255)+','+random(0,255)+',0)';
    Dots.push({
      x:x,
      y:y,
      dx: random(1, 3),
      color: color,
      cap: 0 // 柱状图时的帽子
    })
  }
}
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
  var w = width / size; // 宽度
  var cw = w * 0.6; // 柱子宽度
  var capH = cw > 10 ? 10 : cw; // 帽子高度
  for (var i = 0; i < size; i++) {
    var o = Dots[i];
    if (draw.type === 'column') {
      ctx.fillStyle = line; // 画柱状图
      var h = arr[i] / 256 * height;
      ctx.fillRect(w*i, height - h,cw, h); //画柱子
      ctx.fillRect(w*i, height - (o.cap+capH),cw, capH); //画柱子上的小帽
      o.cap --;
      if (o.cap < 0) {
        o.cap = 0
      }
      if (h > 0 && o.cap < h + 40) {
        o.cap = h + 40 > height - capH ? height - capH : h + 40;
      }
    }else if (draw.type === 'dot') {
      ctx.beginPath();
      var r = 10 + arr[i] / 256 * (height>width ? width : height) / 20;// 圆的半径，最大为50
      ctx.arc(o.x, o.y, r, 0, Math.PI*2, true)
      var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
      g.addColorStop(0, '#fff');
      g.addColorStop(1, o.color);
      ctx.fillStyle = g;
      ctx.fill()
      o.x += o.dx;
      o.x = o.x > width ? 0 : o.x;
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
    mv.play('/media/'+this.title)
  }
}

var ani; // 计时器对象
// 取消动画兼容，这里我用的是这个函数和老师做法不一样，参考https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame
cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame ||  window.webkitCancelRequestAnimationFrame || mozCancelAnimationFrame;


$('#volume')[0].onchange = function () {
  mv.changeVolume(this.value/this.max);
}
