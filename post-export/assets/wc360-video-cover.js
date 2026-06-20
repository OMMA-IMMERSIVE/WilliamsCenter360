(function () {
  "use strict";

  var STATIC_VIDEO_ID = "video_FEF1B6B4_E5E9_871D_41CA_8E30EADCF75C";
  var state = false;
  var hideTimer = null;

  function getTourPlayer() {
    return window.tour && window.tour.player && window.tour.player.getById ? window.tour.player : null;
  }

  function getStaticVideoMedia() {
    var player = getTourPlayer();

    if (!player) {
      return null;
    }

    return player.getById(STATIC_VIDEO_ID);
  }

  function getStaticVideoPlayer() {
    var player = getTourPlayer();
    var media = getStaticVideoMedia();
    var players;
    var i;
    var currentPlayer;

    if (!player || !media) {
      return null;
    }

    if (player.getCurrentPlayerWithMedia) {
      currentPlayer = player.getCurrentPlayerWithMedia(media);

      if (currentPlayer) {
        return currentPlayer;
      }
    }

    if (player.getByClassName) {
      players = player.getByClassName("VideoPlayer");

      for (i = 0; i < players.length; i += 1) {
        if (players[i] && players[i].get && players[i].get("video") === media) {
          return players[i];
        }
      }
    }

    return null;
  }

  function setPlayerState(visible) {
    var player = getStaticVideoPlayer();

    state = !!visible;
    window.WC360_STATIC_VIDEO_VISIBLE = state;

    if (!player || !player.set) {
      return;
    }

    player.set("visible", state);
    player.set("enabled", state);

    if (!state && player.pause) {
      player.pause();
    }

    if (!state && player.stop) {
      player.stop();
    }
  }

  function toggle() {
    setPlayerState(!state);
  }

  function startHiding() {
    var attempts = 0;

    if (hideTimer) {
      window.clearInterval(hideTimer);
    }

    hideTimer = window.setInterval(function () {
      attempts += 1;
      setPlayerState(false);

      if (getStaticVideoPlayer() || attempts >= 80) {
        window.clearInterval(hideTimer);
        hideTimer = null;
      }
    }, 250);
  }

  function start() {
    window.WC360_STATIC_VIDEO_SET = setPlayerState;
    window.WC360_STATIC_VIDEO_TOGGLE = toggle;

    startHiding();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
