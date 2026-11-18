/* Вращающийся стакан: развёртка этикетки (assets/label.jpg) рисуется
   вертикальными полосками на 2D-canvas. Без WebGL и библиотек,
   поэтому работает и при открытии index.html прямо с диска. */
(function () {
  var FRONT_U = 0.31;               // где на развёртке центр лицевой стороны
  var TILT_TOP = 0.14, TILT_BOT = 0.22;

  function Cup(canvas, src) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.rot = 0; this.ready = false;
    this.img = new Image();
    var self = this;
    this.img.onload = function () { self.ready = true; self.draw(); };
    this.img.src = src;
    this.resize();
  }

  Cup.prototype.resize = function () {
    var r = this.c.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, Math.round(r.width * dpr));
    this.h = Math.max(1, Math.round(r.height * dpr));
    this.c.width = this.w; this.c.height = this.h;
    this.draw();
  };

  Cup.prototype.draw = function () {
    var g = this.ctx, w = this.w, h = this.h;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    if (!this.ready) return;

    var H = h * 0.76;                 // высота стенки
    var Rt = H * 0.381, Rb = H * 0.298;
    var cx = w / 2, yT = h * 0.115, yB = yT + H;
    var img = this.img, IW = img.naturalWidth, IH = img.naturalHeight;

    // тень на столе
    var sh = g.createRadialGradient(cx, yB + Rb * 0.16, Rb * 0.2, cx, yB + Rb * 0.16, Rb * 1.5);
    sh.addColorStop(0, 'rgba(20,40,20,.30)'); sh.addColorStop(1, 'rgba(20,40,20,0)');
    g.save(); g.translate(0, (yB + Rb * 0.16) * (1 - 0.2)); g.scale(1, 0.2);
    g.fillStyle = sh; g.beginPath(); g.arc(cx, yB + Rb * 0.16, Rb * 1.5, 0, 6.2832); g.fill(); g.restore();

    // стенка: полоски
    var n = Math.max(60, Math.round(Rt * 2 / 1.5));
    var rot = this.rot * Math.PI / 180;
    for (var i = 0; i < n; i++) {
      var s0 = -1 + 2 * i / n, s1 = -1 + 2 * (i + 1) / n, sm = (s0 + s1) / 2;
      var t0 = Math.asin(s0), t1 = Math.asin(s1), tm = Math.asin(sm), cs = Math.cos(tm);
      var u = FRONT_U + (t0 - rot) / 6.283185; u -= Math.floor(u);
      var sw = Math.max(1, (t1 - t0) / 6.283185 * IW);
      var sx = Math.min(u * IW, IW - sw);
      var top = yT + TILT_TOP * Rt * cs, bot = yB + TILT_BOT * Rb * cs;
      g.setTransform((s1 - s0) * Rt + 0.9, 0, s0 * (Rb - Rt), bot - top, cx + s0 * Rt, top);
      g.drawImage(img, sx, 0, sw, IH, 0, 0, 1, 1);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);

    // объём: свет слева, тень по краям
    g.save();
    g.beginPath();
    g.moveTo(cx - Rt, yT);
    g.lineTo(cx - Rb, yB);
    g.ellipse(cx, yB, Rb, Rb * TILT_BOT, 0, Math.PI, 0, true);
    g.lineTo(cx + Rt, yT);
    g.ellipse(cx, yT, Rt, Rt * TILT_TOP, 0, 0, Math.PI, false);
    g.closePath(); g.clip();
    var lg = g.createLinearGradient(cx - Rt, 0, cx + Rt, 0);
    lg.addColorStop(0, 'rgba(10,30,15,.34)');
    lg.addColorStop(0.2, 'rgba(10,30,15,0)');
    lg.addColorStop(0.33, 'rgba(255,255,255,.16)');
    lg.addColorStop(0.5, 'rgba(255,255,255,0)');
    lg.addColorStop(0.8, 'rgba(10,30,15,.10)');
    lg.addColorStop(1, 'rgba(10,30,15,.38)');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    // тень под крышкой
    var ug = g.createLinearGradient(0, yT, 0, yT + H * 0.09);
    ug.addColorStop(0, 'rgba(10,30,15,.30)'); ug.addColorStop(1, 'rgba(10,30,15,0)');
    g.fillStyle = ug; g.fillRect(0, yT, w, H * 0.12);
    g.restore();

    // крышка
    var Rl = Rt * 1.05, lidH = H * 0.05, ry = Rl * TILT_TOP, yL = yT - lidH + ry * 0.35;
    var rim = g.createLinearGradient(cx - Rl, 0, cx + Rl, 0);
    rim.addColorStop(0, '#0c4423'); rim.addColorStop(0.33, '#1f8246'); rim.addColorStop(1, '#0b3d20');
    g.fillStyle = rim;
    g.beginPath();
    g.ellipse(cx, yL + lidH, Rl, ry, 0, 0, Math.PI, false);
    g.lineTo(cx - Rl, yL);
    g.ellipse(cx, yL, Rl, ry, 0, Math.PI, 0, true);
    g.closePath(); g.fill();
    var topg = g.createLinearGradient(cx - Rl, yL - ry, cx + Rl, yL + ry);
    topg.addColorStop(0, '#2a9354'); topg.addColorStop(1, '#17703a');
    g.fillStyle = topg;
    g.beginPath(); g.ellipse(cx, yL, Rl, ry, 0, 0, 6.2832); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(1, w / 420);
    g.beginPath(); g.ellipse(cx, yL, Rl * 0.3, ry * 0.3, 0, 0, 6.2832); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.18)';
    g.beginPath(); g.ellipse(cx, yL, Rl * 0.93, ry * 0.93, 0, 0, 6.2832); g.stroke();
  };

  window.Cup = Cup;
})();
