(function () {
  "use strict";

  if (window.__wc360VhsDropdownToggleLoaded) {
    return;
  }
  window.__wc360VhsDropdownToggleLoaded = true;

  var DROPDOWN_ID = "DropDown_F0666ED2_C378_D6FF_41CD_19D418B8EC49";
  var ACTIVE_CLASS = "wc360-vhs-active";
  var POLL_MS = 250;
  var boundNode = null;
  var boundObject = null;
  var active = false;

  function getDropdownNode() {
    return document.getElementById(DROPDOWN_ID);
  }

  function setActive(active) {
    var root = document.documentElement;

    root.classList.toggle(ACTIVE_CLASS, !!active);
    root.setAttribute("data-wc360-vhs-active", active ? "true" : "false");

    if (document.body) {
      document.body.classList.toggle(ACTIVE_CLASS, !!active);
    }

    window.WC360_VHS_ACTIVE = !!active;
  }

  function toggleVhs() {
    setActive(!window.WC360_VHS_ACTIVE);
  }

  function isInsideDropdown(node) {
    if (!node || !node.closest) {
      return false;
    }

    return !!node.closest("#" + DROPDOWN_ID) ||
      !!node.closest('[id*="' + DROPDOWN_ID + '"]') ||
      !!node.closest('[role="listbox"]') ||
      !!node.closest('[role="option"]') ||
      !!node.closest('[class*="DropDown"]');
  }

  function openVhs() {
    active = true;
    setActive(true);
  }

  function closeVhs() {
    active = false;
    setActive(false);
  }

  function handleDocumentClick(event) {
    if (!document.documentElement.classList.contains(ACTIVE_CLASS)) {
      return;
    }

    if (isInsideDropdown(event.target)) {
      return;
    }

    closeVhs();
  }

  function handleDocumentKeyDown(event) {
    if (event && (event.key === "v" || event.key === "V")) {
      toggleVhs();
      return;
    }

    if (event && event.key === "Escape") {
      closeVhs();
    }
  }

  function bindObjectEvents(object) {
    if (!object || object === boundObject || !object.bind) {
      return;
    }

    boundObject = object;

    ["show", "open"].forEach(function (eventName) {
      try {
        object.bind(eventName, openVhs, this);
      } catch (err) {
        // ignore unsupported event names
      }
    }, this);

    ["hide", "close"].forEach(function (eventName) {
      try {
        object.bind(eventName, closeVhs, this);
      } catch (err2) {
        // ignore unsupported event names
      }
    }, this);

    try {
      object.bind("stateChange", function () {
        if (object.get && object.get("selectedIndex") >= 0) {
          openVhs();
        } else {
          closeVhs();
        }
      }, this);
    } catch (err3) {
      // ignore unsupported event names
    }
  }

  function bindDropdownNode() {
    var node = getDropdownNode();
    var object = window.tour && window.tour.player && window.tour.player.getById ? window.tour.player.getById(DROPDOWN_ID) : null;

    if (object) {
      bindObjectEvents(object);
    }

    if (node && node !== boundNode) {
      boundNode = node;
      node.addEventListener("pointerdown", openVhs, true);
      node.addEventListener("click", openVhs, true);
      node.addEventListener("mouseenter", openVhs, true);
      node.addEventListener("focusin", openVhs, true);
      node.addEventListener("mouseleave", function () {
        window.setTimeout(function () {
          if (!document.documentElement.matches(":hover")) {
            closeVhs();
          }
        }, 120);
      }, true);
    }
  }

  function start() {
    document.documentElement.classList.add("wc360-vhs-enabled");
    window.WC360_VHS_SET = setActive;
    window.WC360_VHS_TOGGLE = toggleVhs;
    document.addEventListener("pointerdown", handleDocumentClick, true);
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", handleDocumentKeyDown, true);

    window.setInterval(bindDropdownNode, POLL_MS);

    bindDropdownNode();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
