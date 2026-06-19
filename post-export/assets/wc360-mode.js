(function () {
  var PARAM_NAME = "wc360Mode";
  var MODE_EMBEDDED = "embedded";
  var MODE_FULL = "full";

  var defaults = {
    embedded: {
      hideIds: [],
      removeIds: []
    },
    full: {
      hideIds: [],
      removeIds: []
    }
  };

  function assign(target, source) {
    if (!source) {
      return target;
    }

    Object.keys(source).forEach(function (key) {
      target[key] = source[key];
    });

    return target;
  }

  function getParams(value) {
    var params = new URLSearchParams(value || "");
    var result = {};

    params.forEach(function (paramValue, key) {
      result[key.toLowerCase()] = paramValue;
    });

    return result;
  }

  function normalizeMode(value) {
    value = String(value || "").toLowerCase();

    if (value === "embed" || value === "embedded") {
      return MODE_EMBEDDED;
    }

    return MODE_FULL;
  }

  function getMode() {
    var search = getParams(window.location.search);
    var hash = getParams(window.location.hash.replace(/^#/, ""));
    var mode = search[PARAM_NAME.toLowerCase()] || search.mode || hash[PARAM_NAME.toLowerCase()] || hash.mode;

    return normalizeMode(mode);
  }

  function getConfig(mode) {
    var external = window.WC360_MODE_CONFIG || {};
    var config = {
      hideIds: [],
      removeIds: []
    };

    assign(config, defaults[mode]);
    assign(config, external[mode]);

    config.hideIds = config.hideIds || [];
    config.removeIds = config.removeIds || [];

    return config;
  }

  function getPlayerObject(id) {
    if (!window.tour || !window.tour.player || !window.tour.player.getById) {
      return null;
    }

    return window.tour.player.getById(id);
  }

  function setObjectRemoved(id) {
    var object = getPlayerObject(id);

    if (!object || !object.set) {
      return false;
    }

    object.set("visible", false);
    object.set("enabled", false);

    return true;
  }

  function applyMode() {
    var mode = window.WC360_MODE;
    var config = getConfig(mode);
    var ids = config.hideIds.concat(config.removeIds);
    var applied = 0;

    ids.forEach(function (id) {
      if (setObjectRemoved(id)) {
        applied += 1;
      }
    });

    document.documentElement.setAttribute("data-wc360-mode", mode);
    document.body && document.body.setAttribute("data-wc360-mode", mode);
    window.WC360_MODE_APPLIED_COUNT = applied;

    return applied;
  }

  function waitForTour() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;

      if (window.tour && window.tour.player) {
        applyMode();
        window.WC360_MODE_READY = true;
      }

      if (attempts >= 120 || window.WC360_MODE_READY) {
        window.clearInterval(timer);
      }
    }, 250);
  }

  window.WC360_MODE = getMode();
  document.documentElement.setAttribute("data-wc360-mode", window.WC360_MODE);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForTour);
  } else {
    waitForTour();
  }
})();
