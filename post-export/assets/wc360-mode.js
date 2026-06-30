(function () {
  var PARAM_NAME = "wc360Mode";
  var MODE_EMBEDDED = "embedded";
  var MODE_FULL = "full";
  var DEFAULT_START_BUTTON_ID = "Button_8ABCDA12_B819_62B3_41D2_F34BF4720F6A";
  var EXIT_BUTTON_ID = "Button_F8824518_B82E_A6BF_4198_E5695E18D1C4";
  var DEFAULT_START_PLAYLIST_INDEX = 1;
  var FULL_MODE_HIDDEN_IDS = [
    "ViewerAreaLabeled_978428B3_B81B_AFF1_41E5_CAA80CE8B646",
    "ViewerAreaLabeled_978428B3_B81B_AFF1_41E5_CAA80CE8B646VideoPlayer",
    "Image_FD2BB913_B817_6EB1_41CD_9D385809EC4E",
    "Button_F8824518_B82E_A6BF_4198_E5695E18D1C4",
    "Button_8ABCDA12_B819_62B3_41D2_F34BF4720F6A",
    "Button_8837140B_B819_A691_41D6_D10830F52B94",
    "Button_8BBB5CAA_B816_E793_41E3_F9F0F17FE658",
    "Button_8B39B0A2_B817_BF93_41D2_2E0DA94E8BC1",
    "Button_8E664C53_B839_66B1_41D7_09B458891924",
    "Button_8113E501_B81A_A691_41DA_96AE5D8E2D65",
    "Button_8AE011F6_B817_6173_41D7_7BD482325563",
    "Button_882A4B7A_B869_A173_41C0_87A6B9FAD535",
    "Button_8B766281_B86A_A391_41E0_A89206234E13"
  ];
  var defaultStartApplied = false;
  var defaultStartRetryTimer = null;
  var exitGuardTimer = null;

  var defaults = {
    embedded: {
      hideIds: [],
      removeIds: []
    },
    full: {
      hideIds: FULL_MODE_HIDDEN_IDS,
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

    if (id === "ViewerAreaLabeled_978428B3_B81B_AFF1_41E5_CAA80CE8B646VideoPlayer") {
      if (object.stop) {
        object.stop();
      }

      object.set("video", null);
    }

    return true;
  }

  function injectFullModeStyle() {
    if (window.WC360_MODE !== MODE_FULL) {
      return;
    }

    var style = document.createElement("style");
    style.id = "wc360-full-mode-hidden-style";
    style.textContent = FULL_MODE_HIDDEN_IDS.map(function (id) {
      return "#" + id;
    }).join(",\n") + " { display: none !important; }";
    document.head.appendChild(style);
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

  function applyDefaultStart() {
    if (defaultStartApplied) {
      return false;
    }

    var atriumButton = getPlayerObject(DEFAULT_START_BUTTON_ID);

    if (window.WC360_MODE === MODE_FULL && atriumButton && atriumButton.trigger) {
      atriumButton.trigger("click");
    }

    if (window.tour && window.tour.player && window.tour.player.setPlayListSelectedIndex && window.tour.player.mainPlayList) {
      window.tour.player.setPlayListSelectedIndex(window.tour.player.mainPlayList, DEFAULT_START_PLAYLIST_INDEX);
    }

    defaultStartApplied = true;
    return true;
  }

  function scheduleDefaultStartRetry() {
    var attempts = 0;

    if (defaultStartRetryTimer) {
      window.clearInterval(defaultStartRetryTimer);
    }

    defaultStartRetryTimer = window.setInterval(function () {
      attempts += 1;

      if (window.WC360_MODE !== MODE_FULL || defaultStartApplied) {
        window.clearInterval(defaultStartRetryTimer);
        defaultStartRetryTimer = null;
        return;
      }

      if (applyDefaultStart() || attempts >= 20) {
        window.clearInterval(defaultStartRetryTimer);
        defaultStartRetryTimer = null;
      }
    }, 250);
  }

  function guardDefaultExitButton() {
    if (window.WC360_MODE !== MODE_FULL) {
      return;
    }

    var object = getPlayerObject(EXIT_BUTTON_ID);
    var elements = document.querySelectorAll('[id*="F8824518_B82E_A6BF_4198_E5695E18D1C4"]');

    if (object && object.set) {
      if (!object.get || object.get("visible") !== false) {
        object.set("visible", false);
      }

      if (!object.get || object.get("enabled") !== false) {
        object.set("enabled", false);
      }
    }

    Array.prototype.forEach.call(elements, function (element) {
      element.style.setProperty("display", "none", "important");
      element.setAttribute("aria-hidden", "true");
    });
  }

  function waitForTour() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;

      if (window.tour && window.tour.player) {
        var startReady = applyDefaultStart();

        if (window.WC360_MODE === MODE_EMBEDDED || startReady || defaultStartApplied) {
          applyMode();
          guardDefaultExitButton();

          if (window.WC360_MODE === MODE_FULL && !exitGuardTimer) {
            exitGuardTimer = window.setInterval(guardDefaultExitButton, 500);
          }

          window.WC360_MODE_READY = true;
        } else {
          scheduleDefaultStartRetry();
        }
      }

      if (attempts >= 120 || window.WC360_MODE_READY) {
        window.clearInterval(timer);
      }
    }, 250);
  }

  window.WC360_MODE = getMode();
  document.documentElement.setAttribute("data-wc360-mode", window.WC360_MODE);
  injectFullModeStyle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForTour);
  } else {
    waitForTour();
  }
})();
