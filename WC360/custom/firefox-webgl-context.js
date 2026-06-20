(function () {
  var ua = navigator.userAgent || "";
  var isFirefoxMac = /Firefox\//.test(ua) && /Macintosh|Mac OS X/.test(ua);

  if (!isFirefoxMac || !window.HTMLCanvasElement) {
    return;
  }

  var originalGetContext = HTMLCanvasElement.prototype.getContext;

  if (!originalGetContext || originalGetContext.__wc360FirefoxWebGLPatch) {
    return;
  }

  function patchedGetContext(type, attrs) {
    if (type === "webgl2" || type === "webgl" || type === "experimental-webgl") {
      var safeAttrs = Object.assign({}, attrs || {}, {
        antialias: false,
        preserveDrawingBuffer: false,
        alpha: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance"
      });

      return originalGetContext.call(this, type, safeAttrs);
    }

    return originalGetContext.call(this, type, attrs);
  }

  patchedGetContext.__wc360FirefoxWebGLPatch = true;
  HTMLCanvasElement.prototype.getContext = patchedGetContext;
})();
