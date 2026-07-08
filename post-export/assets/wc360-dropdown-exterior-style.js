(function () {
  var DROPDOWN_ID = "DropDown_F0666ED2_C378_D6FF_41CD_19D418B8EC49";
  var STYLE_CLASS = "wc360-dropdown-exterior-badge";
  var YELLOW = "#FFCC00";
  var BLACK = "#000000";

  function setImportant(el, prop, value) {
    if (el && el.style) {
      el.style.setProperty(prop, value, "important");
    }
  }

  function isBottomExteriorButton(node) {
    return !!(node && node.closest && node.closest("#Button_8113E501_B81A_A691_41DA_96AE5D8E2D65"));
  }

  function isDropdownRelated(node) {
    if (!node || !node.closest) {
      return false;
    }

    return !!(
      node.closest("#" + DROPDOWN_ID) ||
      node.closest('[id*="DropDown_F0666ED2_C378_D6FF_41CD_19D418B8EC49"]') ||
      node.closest('[class*="DropDown"]') ||
      node.closest('[aria-role="listbox"]') ||
      node.closest('[role="listbox"]') ||
      node.closest('[role="option"]')
    );
  }

  function styleBadge(el) {
    el.classList.add(STYLE_CLASS);
    setImportant(el, "display", "inline-flex");
    setImportant(el, "align-items", "center");
    setImportant(el, "justify-content", "center");
    setImportant(el, "box-sizing", "border-box");
    setImportant(el, "padding", "3px 8px");
    setImportant(el, "line-height", "1.1");
    setImportant(el, "white-space", "nowrap");
    setImportant(el, "background-color", YELLOW);
    setImportant(el, "color", BLACK);
    setImportant(el, "text-shadow", "none");
  }

  function wrapTextNode(textNode) {
    var span;

    if (!textNode || !textNode.parentNode || textNode.parentElement.classList.contains(STYLE_CLASS)) {
      return;
    }

    span = document.createElement("span");
    span.className = STYLE_CLASS;
    span.textContent = textNode.nodeValue;
    textNode.parentNode.replaceChild(span, textNode);
    styleBadge(span);
  }

  function styleExteriorDropdownText(root) {
    var walker;
    var node;

    if (!root || !document.createTreeWalker) {
      return;
    }

    Array.prototype.forEach.call(root.querySelectorAll("." + STYLE_CLASS), styleBadge);

    walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (textNode) {
        var parent = textNode.parentElement;
        var text = textNode.nodeValue || "";

        if (text.trim() !== "EXTERIOR" || !parent || isBottomExteriorButton(parent) || !isDropdownRelated(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    node = walker.nextNode();

    while (node) {
      wrapTextNode(node);
      node = walker.nextNode();
    }
  }

  function apply() {
    styleExteriorDropdownText(document.body);
  }

  function start() {
    var attempts = 0;

    apply();

    window.setInterval(apply, 500);

    var startupTimer = window.setInterval(function () {
      attempts += 1;
      apply();

      if (attempts >= 80) {
        window.clearInterval(startupTimer);
      }
    }, 125);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
