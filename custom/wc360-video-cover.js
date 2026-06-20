(function () {
  var STYLE_ID = "wc360-video-cover-style";
  var SCALE_MODE_COVER = "fit_outside";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#viewer video, #preloadContainer video {",
      "  width: 100% !important;",
      "  height: 100% !important;",
      "  min-width: 100% !important;",
      "  min-height: 100% !important;",
      "  object-fit: cover !important;",
      "  object-position: center center !important;",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function applyVideoCover() {
    if (!window.tour || !window.tour.player || !window.tour.player.getByClassName) {
      return 0;
    }

    var videos = window.tour.player.getByClassName("Video") || [];

    videos.forEach(function (video) {
      if (video && video.set && video.get("scaleMode") !== SCALE_MODE_COVER) {
        video.set("scaleMode", SCALE_MODE_COVER);
      }
    });

    return videos.length;
  }

  function start() {
    var attempts = 0;

    injectStyle();

    var timer = window.setInterval(function () {
      attempts += 1;

      if (applyVideoCover() > 0 || attempts >= 240) {
        window.clearInterval(timer);
      }
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
