(function () {
  if (window.WC360_MODE && window.WC360_MODE !== "embedded") {
    return;
  }

  var MENU_BUTTON_IDS = [
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

  var STEP_MS = 5000;
  var IDLE_RESTART_MS = 5000;
  var INITIAL_START_MS = 0;
  var EXTERIOR_BUTTON_ID = "Button_8113E501_B81A_A691_41DA_96AE5D8E2D65";
  var ACTIVE_COLOR = "#FFCC00";
  var INACTIVE_COLOR = "#FFFFFF";
  var EXTERIOR_COLOR = "#000000";
  var EXTERIOR_BACKGROUND = "#999999";
  var cycleTimer = null;
  var idleTimer = null;
  var currentIndex = -1;
  var activeAutocycleId = null;
  var hasUserControl = false;
  var delegatedListenersAttached = false;
  var syntheticInteractionDepth = 0;
  var playerListenerObjects = {};
  var userHoverId = null;

  function getPlayerObject(id) {
    if (!window.tour || !window.tour.player || !window.tour.player.getById) {
      return null;
    }

    return window.tour.player.getById(id);
  }

  function setImportant(el, prop, value) {
    if (el && el.style) {
      el.style.setProperty(prop, value, "important");
    }
  }

  function ensureExteriorStyle() {
    var object = getPlayerObject(EXTERIOR_BUTTON_ID);
    var el = document.getElementById(EXTERIOR_BUTTON_ID);

    if (object && object.set) {
      object.set("fontColor", EXTERIOR_COLOR);
      object.set("rollOverFontColor", EXTERIOR_COLOR);
      object.set("backgroundOpacity", 1);
      object.set("rollOverBackgroundOpacity", 1);
    }

    if (el) {
      setImportant(el, "background-color", EXTERIOR_BACKGROUND);
      setImportant(el, "color", EXTERIOR_COLOR);
      setImportant(el, "text-shadow", "none");

      Array.prototype.forEach.call(el.querySelectorAll("*"), function (child) {
        setImportant(child, "background-color", EXTERIOR_BACKGROUND);
        setImportant(child, "color", EXTERIOR_COLOR);
        setImportant(child, "text-shadow", "none");
      });
    }
  }

  function dispatchSyntheticHover(el) {
    ["pointerover", "mouseover", "mouseenter"].forEach(function (type) {
      var event;

      try {
        event = new MouseEvent(type, {
          bubbles: type !== "mouseenter",
          cancelable: true,
          view: window
        });
      } catch (err) {
        event = document.createEvent("MouseEvents");
        event.initMouseEvent(type, type !== "mouseenter", true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      }

      el.dispatchEvent(event);
    });
  }

  function resetButton(id) {
    var object = getPlayerObject(id);
    var el = document.getElementById(id);

    if (id === EXTERIOR_BUTTON_ID) {
      ensureExteriorStyle();
      return;
    }

    if (object && object.set) {
      object.set("fontColor", INACTIVE_COLOR);
      object.set("rollOverFontColor", INACTIVE_COLOR);
      object.set("backgroundOpacity", 0);
    }

    if (el) {
      el.style.setProperty("color", INACTIVE_COLOR, "important");
      el.style.backgroundColor = "";
      el.style.removeProperty("background-color");

      Array.prototype.forEach.call(el.querySelectorAll("*"), function (child) {
        child.style.setProperty("color", INACTIVE_COLOR, "important");
        child.style.backgroundColor = "";
        child.style.removeProperty("background-color");
      });
    }
  }

  function resetButtonsExcept(activeId) {
    MENU_BUTTON_IDS.forEach(function (id) {
      if (id !== activeId) {
        resetButton(id);
      }
    });
  }

  function triggerButton(id) {
    var object = getPlayerObject(id);
    var el = document.getElementById(id);

    resetButtonsExcept(id);

    if (object && object.set) {
      object.set("fontColor", id === EXTERIOR_BUTTON_ID ? EXTERIOR_COLOR : INACTIVE_COLOR);
      object.set("rollOverFontColor", id === EXTERIOR_BUTTON_ID ? EXTERIOR_COLOR : ACTIVE_COLOR);
    }

    if (object && object.trigger) {
      syntheticInteractionDepth += 1;
      object.trigger("rollOver");
      syntheticInteractionDepth -= 1;
    }

    if (el) {
      syntheticInteractionDepth += 1;
      dispatchSyntheticHover(el);
      syntheticInteractionDepth -= 1;

      if (id === EXTERIOR_BUTTON_ID) {
        ensureExteriorStyle();
      } else {
        el.style.setProperty("color", ACTIVE_COLOR, "important");

        Array.prototype.forEach.call(el.querySelectorAll("*"), function (child) {
          child.style.setProperty("color", ACTIVE_COLOR, "important");
        });
      }
    }

    if (id === EXTERIOR_BUTTON_ID) {
      ensureExteriorStyle();
    }

    activeAutocycleId = id;
  }

  function stopCycle(resetActive) {
    if (cycleTimer) {
      window.clearInterval(cycleTimer);
      cycleTimer = null;
    }

    if (resetActive !== false && activeAutocycleId) {
      resetButton(activeAutocycleId);
      activeAutocycleId = null;
    }
  }

  function nextItem() {
    var userButton = getUserControlledButton();

    if (userButton) {
      hasUserControl = true;
      activeAutocycleId = userButton.id;
      setCurrentIndexFromId(userButton.id);
      stopCycle(false);
      return;
    }

    currentIndex = (currentIndex + 1) % MENU_BUTTON_IDS.length;
    triggerButton(MENU_BUTTON_IDS[currentIndex]);
  }

  function startCycle() {
    if (cycleTimer || hasUserControl) {
      return;
    }

    nextItem();
    cycleTimer = window.setInterval(nextItem, STEP_MS);
  }

  function startInitialCycle() {
    window.setTimeout(startCycle, INITIAL_START_MS);
  }

  function scheduleRestart() {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }

    idleTimer = window.setTimeout(function () {
      var userButton = getUserControlledButton();

      idleTimer = null;

      if (userButton) {
        hasUserControl = true;
        userHoverId = userButton.id;
        activeAutocycleId = userButton.id;
        setCurrentIndexFromId(userButton.id);
        return;
      }

      userHoverId = null;
      hasUserControl = false;
      startCycle();
    }, IDLE_RESTART_MS);
  }

  function setCurrentIndexFromId(id) {
    var index = MENU_BUTTON_IDS.indexOf(id);

    if (index !== -1) {
      currentIndex = index;
    }
  }

  function handleUserEnter(event) {
    var id = event && event.currentTarget ? event.currentTarget.id : null;

    if (event && event.isTrusted === false) {
      return;
    }

    if (!id) {
      return;
    }

    if (hasUserControl && userHoverId === id) {
      if (idleTimer) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }

      return;
    }

    if (idleTimer) {
      window.clearTimeout(idleTimer);
      idleTimer = null;
    }

    userHoverId = id;
    hasUserControl = true;
    stopCycle(true);
    setCurrentIndexFromId(id);
    triggerButton(id);
  }

  function handleUserLeave(event) {
    var id = event && event.currentTarget ? event.currentTarget.id : null;

    if (event && event.isTrusted === false) {
      return;
    }

    if (id && userHoverId && id !== userHoverId) {
      return;
    }

    userHoverId = null;

    if (event && event.currentTarget) {
      activeAutocycleId = event.currentTarget.id;
      setCurrentIndexFromId(activeAutocycleId);
    }

    scheduleRestart();
  }

  function handleUserTouch(event) {
    handleUserEnter(event);
    scheduleRestart();
  }

  function getMenuButtonFromNode(node) {
    while (node && node !== document) {
      if (node.id && MENU_BUTTON_IDS.indexOf(node.id) !== -1) {
        return node;
      }

      node = node.parentNode;
    }

    return null;
  }

  function getUserControlledButton() {
    return userHoverId ? document.getElementById(userHoverId) : null;
  }

  function handleDelegatedEnter(event) {
    var button = getMenuButtonFromNode(event.target);
    var previousButton = getMenuButtonFromNode(event.relatedTarget);

    if (!button || button === previousButton) {
      return;
    }

    handleUserEnter({
      currentTarget: button,
      isTrusted: event.isTrusted
    });
  }

  function handleDelegatedLeave(event) {
    var button = getMenuButtonFromNode(event.target);
    var nextButton = getMenuButtonFromNode(event.relatedTarget);

    if (!button || button === nextButton) {
      return;
    }

    handleUserLeave({
      currentTarget: button,
      isTrusted: event.isTrusted
    });
  }

  function attachDelegatedListeners() {
    if (delegatedListenersAttached) {
      return;
    }

    document.addEventListener("pointerover", handleDelegatedEnter, true);
    document.addEventListener("pointerout", handleDelegatedLeave, true);
    document.addEventListener("focusin", handleDelegatedEnter, true);
    document.addEventListener("focusout", handleDelegatedLeave, true);
    delegatedListenersAttached = true;
  }

  function attachUserListeners() {
    MENU_BUTTON_IDS.forEach(function (id) {
      var el = document.getElementById(id);

      if (!el || el.__wc360MenuAutocycleListeners) {
        return;
      }

      ["pointerenter", "mouseenter", "focus"].forEach(function (type) {
        el.addEventListener(type, handleUserEnter, { passive: true });
      });

      ["pointerleave", "mouseleave", "blur"].forEach(function (type) {
        el.addEventListener(type, handleUserLeave, { passive: true });
      });

      el.addEventListener("touchstart", handleUserTouch, { passive: true });
      el.__wc360MenuAutocycleListeners = true;
    });
  }

  function attachPlayerListeners() {
    MENU_BUTTON_IDS.forEach(function (id) {
      var object = getPlayerObject(id);

      if (!object || !object.bind || playerListenerObjects[id] === object) {
        return;
      }

      object.bind("rollOver", function () {
        if (syntheticInteractionDepth) {
          return;
        }

        handleUserEnter({ currentTarget: { id: id }, isTrusted: true });
      });

      object.bind("rollOut", function () {
        if (syntheticInteractionDepth) {
          return;
        }

        handleUserLeave({ currentTarget: { id: id }, isTrusted: true });
      });

      playerListenerObjects[id] = object;
    });
  }

  function isMenuReady() {
    return MENU_BUTTON_IDS.some(function (id) {
      return !!getPlayerObject(id);
    });
  }

  function waitForMenu() {
    var attempts = 0;

    attachDelegatedListeners();

    var timer = window.setInterval(function () {
      attempts += 1;
      attachUserListeners();
      attachPlayerListeners();

      if (isMenuReady() || attempts >= 240) {
        window.clearInterval(timer);
        attachUserListeners();
        attachPlayerListeners();
        ensureExteriorStyle();
        window.setInterval(ensureExteriorStyle, 500);
        window.setInterval(attachPlayerListeners, 1000);
        startInitialCycle();
      }
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForMenu);
  } else {
    waitForMenu();
  }
})();
