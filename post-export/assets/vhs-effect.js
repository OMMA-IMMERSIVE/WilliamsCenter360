(function () {
  "use strict";

  if (window.__wc360VhsEffectLoaded) {
    return;
  }
  window.__wc360VhsEffectLoaded = true;

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function createNode(className, tagName) {
    var node = document.createElement(tagName || "div");
    node.className = className;
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  function getComponentNode(id) {
    return document.getElementById(id) || document.querySelector('[data-id="' + id + '"]');
  }

  function getViewer2Node() {
    return getComponentNode("ViewerAreaLabeled_978428B3_B81B_AFF1_41E5_CAA80CE8B646");
  }

  function getTvFrameNode() {
    var id = "Image_FD2BB913_B817_6EB1_41CD_9D385809EC4E";
    var node = getComponentNode(id);

    if (node) {
      return node;
    }

    var image = document.querySelector('img[src*="' + id + '"], [style*="' + id + '"]');
    if (!image) {
      return null;
    }

    return image.closest("[id]") || image.parentElement;
  }

  function getLayerMount() {
    var viewer2 = getViewer2Node();
    var tvFrame = getTvFrameNode();

    if (viewer2 && tvFrame && tvFrame.parentElement) {
      return {
        parent: tvFrame.parentElement,
        viewer2: viewer2,
        before: tvFrame,
        tvFrame: tvFrame,
        fallback: false
      };
    }

    return {
      parent: document.body,
      viewer2: null,
      before: null,
      tvFrame: null,
      fallback: true
    };
  }

  function setLayerStyle(node, zIndex) {
    node.style.position = node.style.position || "absolute";
    node.style.zIndex = String(zIndex);
  }

  function OverlayEffect() {
    this.effects = {};
    this.onResizeBound = this.onResize.bind(this);
    this.render();
    this.observeMount();
    this.onResize();
    window.addEventListener("resize", this.onResizeBound, false);
  }

  OverlayEffect.prototype.render = function () {
    var mount = getLayerMount();
    var container = createNode("wc360-vhs-screen" + (mount.fallback ? " wc360-vhs-screen--fallback" : ""));
    var wrapper = createNode("wc360-vhs-wrapper wobbley");

    container.appendChild(wrapper);
    mount.parent.insertBefore(container, mount.before);

    this.nodes = {
      container: container,
      wrapper: wrapper
    };

    this.nodes.scanlines = createNode("scanlines");
    wrapper.appendChild(this.nodes.scanlines);
  };

  OverlayEffect.prototype.ensureMounted = function () {
    var mount = getLayerMount();
    var container = this.nodes.container;

    container.classList.toggle("wc360-vhs-screen--fallback", mount.fallback);

    if (!mount.fallback) {
      setLayerStyle(mount.viewer2, 10);
      setLayerStyle(container, 20);
      setLayerStyle(mount.tvFrame, 30);
    }

    if (container.parentElement !== mount.parent || container.nextSibling !== mount.before) {
      mount.parent.insertBefore(container, mount.before);
      this.onResize();
    }
  };

  OverlayEffect.prototype.observeMount = function () {
    var that = this;

    this.mountObserver = new MutationObserver(function () {
      that.ensureMounted();
    });

    this.mountObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.mountInterval = window.setInterval(function () {
      that.ensureMounted();
    }, 250);
  };

  OverlayEffect.prototype.onResize = function () {
    this.rect = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    if (this.effects.snow && this.effects.snow.enabled) {
      this.effects.snow.node.width = Math.max(1, Math.floor(this.rect.width / 2));
      this.effects.snow.node.height = Math.max(1, Math.floor(this.rect.height / 2));
    }

    if (this.effects.vcr && this.effects.vcr.enabled) {
      this.effects.vcr.node.width = Math.max(1, Math.floor(this.rect.width));
      this.effects.vcr.node.height = Math.max(1, Math.floor(this.rect.height));
      this.generateVCRNoise();
    }
  };

  OverlayEffect.prototype.addSnow = function () {
    var canvas = createNode("snow", "canvas");
    var ctx = canvas.getContext("2d");
    var lastFrame = 0;
    var that = this;

    this.nodes.wrapper.appendChild(canvas);
    this.effects.snow = {
      node: canvas,
      ctx: ctx,
      enabled: true
    };
    this.onResize();

    function animate(time) {
      if (!lastFrame || time - lastFrame > 100) {
        that.generateSnow(ctx);
        lastFrame = time;
      }
      that.snowframe = requestAnimationFrame(animate);
    }

    animate();
  };

  OverlayEffect.prototype.addVCR = function (options) {
    var config = Object.assign({
      fps: 24,
      blur: 1,
      miny: Math.floor(window.innerHeight * 0.58),
      miny2: Math.floor(window.innerHeight * 0.58),
      num: 70
    }, options || {});

    var canvas = createNode("vcr", "canvas");
    this.nodes.wrapper.appendChild(canvas);

    this.effects.vcr = {
      node: canvas,
      ctx: canvas.getContext("2d"),
      enabled: true,
      config: config
    };

    this.onResize();
    this.generateVCRNoise();
  };

  OverlayEffect.prototype.generateVCRNoise = function () {
    var config = this.effects.vcr.config;
    var that = this;

    clearInterval(this.vcrInterval);
    this.vcrInterval = setInterval(function () {
      that.renderTrackingNoise();
    }, 1000 / config.fps);
  };

  OverlayEffect.prototype.generateSnow = function (ctx) {
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var d = ctx.createImageData(w, h);
    var b = new Uint32Array(d.data.buffer);
    var len = b.length;

    for (var i = 0; i < len; i++) {
      b[i] = ((255 * Math.random()) | 0) << 24;
    }

    ctx.putImageData(d, 0, 0);
  };

  OverlayEffect.prototype.renderTrackingNoise = function (radius, xmax, ymax) {
    var canvas = this.effects.vcr.node;
    var ctx = this.effects.vcr.ctx;
    var config = this.effects.vcr.config;
    var posy1 = config.miny || 0;
    var posy2 = config.maxy || canvas.height;
    var posy3 = config.miny2 || 0;
    var num = config.num || 20;

    radius = radius || 2;

    if (xmax === undefined) {
      xmax = canvas.width;
    }

    if (ymax === undefined) {
      ymax = canvas.height;
    }

    canvas.style.filter = "blur(" + config.blur + "px)";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.beginPath();

    for (var i = 0; i <= num; i++) {
      var x = Math.random(i) * xmax;
      var y1 = getRandomInt(posy1 += 3, posy2);
      var y2 = getRandomInt(0, posy3 -= 3);
      ctx.fillRect(x, y1, radius, radius);
      ctx.fillRect(x, y2, radius, radius);
      ctx.fill();

      this.renderTail(ctx, x, y1, radius);
      this.renderTail(ctx, x, y2, radius);
    }

    ctx.closePath();
  };

  OverlayEffect.prototype.renderTail = function (ctx, x, y, radius) {
    var n = getRandomInt(1, 50);
    var dirs = [1, -1];
    var rd = radius;
    var dir = dirs[Math.floor(Math.random() * dirs.length)];

    for (var i = 0; i < n; i++) {
      var step = 0.01;
      var r = getRandomInt((rd -= step), radius);
      var dx = getRandomInt(1, 4);

      radius -= 0.1;
      dx *= dir;

      ctx.fillRect((x += dx), y, r, r);
      ctx.fill();
    }
  };

  OverlayEffect.prototype.destroy = function () {
    window.removeEventListener("resize", this.onResizeBound, false);
    cancelAnimationFrame(this.snowframe);
    clearInterval(this.vcrInterval);
    clearInterval(this.mountInterval);

    if (this.mountObserver) {
      this.mountObserver.disconnect();
    }

    if (this.nodes.container.parentElement) {
      this.nodes.container.parentElement.removeChild(this.nodes.container);
    }
  };

  function start() {
    document.documentElement.classList.add("wc360-vhs-enabled");

    var attempts = 0;

    function createScreen() {
      if (getLayerMount().fallback && attempts < 80) {
        attempts++;
        window.setTimeout(createScreen, 250);
        return;
      }

      var screen = new OverlayEffect();
      screen.addVCR();
      screen.addSnow();
      screen.ensureMounted();
    }

    createScreen();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}());
