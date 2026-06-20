(function () {
  if (window.WC360_MODE && window.WC360_MODE !== "embedded") {
    return;
  }

  var TOP_GRID_IDS = [
    "Button_8ABCDA12_B819_62B3_41D2_F34BF4720F6A",
    "Button_8837140B_B819_A691_41D6_D10830F52B94",
    "Button_8BBB5CAA_B816_E793_41E3_F9F0F17FE658",
    "Button_8B39B0A2_B817_BF93_41D2_2E0DA94E8BC1",
    "Button_8E664C53_B839_66B1_41D7_09B458891924"
  ];

  var BOTTOM_GRID_IDS = [
    "Button_8113E501_B81A_A691_41DA_96AE5D8E2D65",
    "Button_882A4B7A_B869_A173_41C0_87A6B9FAD535",
    "Button_8B766281_B86A_A391_41E0_A89206234E13",
    "Button_8AE011F6_B817_6173_41D7_7BD482325563"
  ];

  var MENU_ROWS = [
    { ids: TOP_GRID_IDS, edge: "top" },
    { ids: BOTTOM_GRID_IDS, edge: "bottom" }
  ];

  var STYLE_ID = "wc360-menu-grid-style";

  function clamp(min, value, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getPlayerObject(id) {
    if (!window.tour || !window.tour.player || !window.tour.player.getById) {
      return null;
    }

    return window.tour.player.getById(id);
  }

  function setPlayerValue(id, key, value) {
    var object = getPlayerObject(id);

    if (object && object.set) {
      object.set(key, value);
    }
  }

  function setImportant(el, prop, value) {
    if (el && el.style) {
      el.style.setProperty(prop, value, "important");
    }
  }

  function getRowContainer(node) {
    var current = node;
    var depth = 0;

    while (current && depth < 4) {
      current = current.parentElement;
      depth += 1;
    }

    return current;
  }

  function injectGridStyle() {
    var style = document.getElementById(STYLE_ID);
    var css = "";

    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    MENU_ROWS.forEach(function (row) {
      row.ids.forEach(function (id, index) {
        var left = (index * 100 / row.ids.length) + "%";
        var width = (100 / row.ids.length) + "%";
        var top = row.edge === "top" ? "0" : "auto";
        var bottom = row.edge === "bottom" ? "0" : "auto";

        css += [
          "#" + id + " {",
          "position: absolute !important;",
          "left: " + left + " !important;",
          "right: auto !important;",
          "top: " + top + " !important;",
          "bottom: " + bottom + " !important;",
          "width: " + width + " !important;",
          "height: 70px !important;",
          "box-sizing: border-box !important;",
          "padding: 0 10px !important;",
          "display: flex !important;",
          "align-items: center !important;",
          "justify-content: center !important;",
          "white-space: nowrap !important;",
          "overflow: hidden !important;",
          "text-overflow: ellipsis !important;",
          "transform: none !important;",
          "}",
          "#" + id + " * {",
          "max-width: 100% !important;",
          "white-space: nowrap !important;",
          "overflow: hidden !important;",
          "text-overflow: ellipsis !important;",
          "}"
        ].join("\n") + "\n";
      });
    });

    style.textContent = css;
  }

  function applyButtonSlot(id, index, count, edge) {
    var el = document.getElementById(id);
    var rowContainer = el ? getRowContainer(el) : null;
    var left = (index * 100 / count) + "%";
    var width = (100 / count) + "%";
    var fontSize = clamp(13, (window.innerWidth || 1280) * 0.018, 26) + "px";

    setPlayerValue(id, "left", left);
    setPlayerValue(id, "right", undefined);
    setPlayerValue(id, "top", edge === "top" ? "0%" : undefined);
    setPlayerValue(id, "bottom", edge === "bottom" ? "0%" : undefined);
    setPlayerValue(id, "width", width);
    setPlayerValue(id, "height", "70px");
    setPlayerValue(id, "fontSize", fontSize);
    setPlayerValue(id, "visible", true);

    if (!el) {
      return;
    }

    setImportant(el, "box-sizing", "border-box");
    setImportant(el, "position", "absolute");
    setImportant(el, "display", "flex");
    setImportant(el, "align-items", "center");
    setImportant(el, "justify-content", "center");
    setImportant(el, "left", left);
    setImportant(el, "right", "auto");
    setImportant(el, "top", edge === "top" ? "0" : "auto");
    setImportant(el, "bottom", edge === "bottom" ? "0" : "auto");
    setImportant(el, "width", width);
    setImportant(el, "height", "70px");
    setImportant(el, "padding", "0 10px");
    setImportant(el, "font-size", fontSize);
    setImportant(el, "white-space", "nowrap");
    setImportant(el, "overflow", "hidden");
    setImportant(el, "text-overflow", "ellipsis");
    setImportant(el, "transform", "none");

    if (rowContainer) {
      setImportant(rowContainer, "position", "absolute");
      setImportant(rowContainer, "left", "0");
      setImportant(rowContainer, "right", "0");
      setImportant(rowContainer, "top", edge === "top" ? "0" : "auto");
      setImportant(rowContainer, "bottom", edge === "bottom" ? "0" : "auto");
      setImportant(rowContainer, "width", "100%");
      setImportant(rowContainer, "height", "70px");
      setImportant(rowContainer, "display", "block");
      setImportant(rowContainer, "visibility", "visible");
      setImportant(rowContainer, "opacity", "1");
      setImportant(rowContainer, "overflow", "visible");
    }
  }

  function applyMenuGrid() {
    injectGridStyle();

    MENU_ROWS.forEach(function (row) {
      row.ids.forEach(function (id, index) {
        applyButtonSlot(id, index, row.ids.length, row.edge);
      });
    });
  }

  function start() {
    var attempts = 0;
    var startupTimer = window.setInterval(function () {
      attempts += 1;
      applyMenuGrid();

      if (attempts >= 60) {
        window.clearInterval(startupTimer);
      }
    }, 250);

    window.setInterval(applyMenuGrid, 2000);
    window.addEventListener("resize", applyMenuGrid);
    window.addEventListener("orientationchange", applyMenuGrid);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
