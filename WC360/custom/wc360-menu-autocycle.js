(function () {
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
  var cycleTimer = null;
  var idleTimer = null;
  var currentIndex = -1;
  var activeAutocycleId = null;
  var hasUserControl = false;

  function getPlayerObject(id) {
    if (!window.tour || !window.tour.player || !window.tour.player.getById) {
      return null;
    }

    return window.tour.player.getById(id);
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

  function dispatchSyntheticUnhover(el) {
    ["pointerout", "mouseout", "mouseleave"].forEach(function (type) {
      var event;

      try {
        event = new MouseEvent(type, {
          bubbles: type !== "mouseleave",
          cancelable: true,
          view: window
        });
      } catch (err) {
        event = document.createEvent("MouseEvents");
        event.initMouseEvent(type, type !== "mouseleave", true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      }

      el.dispatchEvent(event);
    });
  }

  function resetButton(id) {
    var object = getPlayerObject(id);
    var el = document.getElementById(id);

    if (object && object.trigger) {
      object.trigger("rollOut");
    }

    if (object && object.set) {
      object.set("fontColor", "#FFFFFF");
      object.set("backgroundOpacity", 0);
    }

    if (el) {
      dispatchSyntheticUnhover(el);
      el.style.color = "";
      el.style.backgroundColor = "";
      el.style.removeProperty("color");
      el.style.removeProperty("background-color");

      Array.prototype.forEach.call(el.querySelectorAll("*"), function (child) {
        child.style.color = "";
        child.style.backgroundColor = "";
        child.style.removeProperty("color");
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

    if (object && object.trigger) {
      object.trigger("rollOver");
    }

    if (el) {
      dispatchSyntheticHover(el);
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

  function scheduleRestart() {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }

    idleTimer = window.setTimeout(function () {
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

    if (idleTimer) {
      window.clearTimeout(idleTimer);
      idleTimer = null;
    }

    hasUserControl = true;
    stopCycle(true);
    setCurrentIndexFromId(id);
    triggerButton(id);
  }

  function handleUserLeave(event) {
    if (event && event.isTrusted === false) {
      return;
    }

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

  function isMenuReady() {
    return MENU_BUTTON_IDS.some(function (id) {
      return !!getPlayerObject(id);
    });
  }

  function waitForMenu() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      attachUserListeners();

      if (isMenuReady() || attempts >= 240) {
        window.clearInterval(timer);
        attachUserListeners();
        startCycle();
      }
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForMenu);
  } else {
    waitForMenu();
  }
})();
