function Slate(elementId, width, height) {
  var canvas = document.getElementById(elementId);
  var ctx = canvas.getContext('2d');

  if (typeof width === 'undefined' || typeof heigit === 'undefined') {
    canvas.style.cssText += 'width:100%; height:100%';

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    canvas.style.width = '';
    canvas.style.height = '';
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.msRequestAnimationFrame ||
                              function (cb) {
                                window.setTimeout(cb, 1000 / 60);
                              };
  window.requestAnimationFrame = requestAnimationFrame;

  var looping = true;
  var loopingCb;

  Slate.prototype.do = function(cb) {
    ctx.save();
    cb(ctx);
    ctx.restore();
  }

  Slate.prototype.startLoop = function(cb) {
    loopingCb = function(time) {
      ctx.save();
      cb(ctx, time);
      ctx.restore();
      if (looping)
        window.requestAnimationFrame(loopingCb);
    }
    window.requestAnimationFrame(loopingCb);
  }

  Slate.prototype.makeFullsize = function() {
    var s = 'width:100%; height:100%; padding:0; margin:0;';
    document.body.style.cssText += s;
    document.body.parentNode.style.cssText += s;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.onresize = function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    return this;
  }

  Slate.prototype.stopLoop = function() {
    looping = false;
    loopingCb = undefined;
  }

  Slate.prototype.hsla = function(h, s, l, a) {
    var s = Math.round(s * 100);
    var l = Math.round(l * 100);
    return 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')';
  }
  Slate.prototype.rgba = function(r, g, b, a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  this.canvas = canvas;
  this.ctx = ctx;
}
