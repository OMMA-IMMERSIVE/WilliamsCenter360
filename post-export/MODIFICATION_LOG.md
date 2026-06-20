# WC360 Post-Export Modifications

This directory records changes that should be re-applied after exporting the tour from 3DVista.

## Workflow

1. Export the 3DVista tour into the repository root.
2. From the repository root, run:

   ```sh
   ./post-export/apply-mods.sh
   ```

3. Preview with a local server from the repository root:

   ```sh
   python3 -m http.server 8000
   ```

   Then open `http://localhost:8000/`.

## Modifications

### `firefox-gaussian-splats`

- Runtime files added: `custom/firefox-webgl-context.js`.
- Injection point: `index.htm`, immediately before `lib/tdvplayer.js`.
- Target browser: Firefox on macOS, detected from `navigator.userAgent`.
- Behavior: monkeypatches `HTMLCanvasElement.prototype.getContext` so WebGL contexts request `antialias: false`, `preserveDrawingBuffer: false`, `alpha: false`, `depth: false`, `stencil: false`, and `powerPreference: "high-performance"`.
- Reason: this avoids editing 3DVista runtime bundles while applying the Firefox/macOS WebGL fallback before 3DVista creates its renderer.
- Do not patch `script_general.js`, `script_mobile.js`, `lib/tdvplayer.js`, or `lib/tdvgs.js`; changing generated 3DVista files can trigger 3DVista Academic/watermark behavior.

### `vhs-effect`

- Status: removed from the export path.
- The old VHS overlay assets remain in `post-export/assets/` for reference, but `apply-mods.sh` no longer copies or injects them.
- Reason: the previous implementation was too much moving machinery for the current goal. We’re keeping only the static-video visibility toggle.

### `url-mode-wrapper`

- Runtime files added: `custom/wc360-mode.js`.
- Injection point: `index.htm`, immediately after `script.js`.
- Behavior: reads `wc360Mode` or `mode` from the query string/hash and exposes it as `window.WC360_MODE` plus `data-wc360-mode` attributes.
- Default behavior: root/full mode hides the secondary preview viewer, TV border image, and nine venue buttons, leaving the dropdown menu available.
- Embedded behavior: `/embed/` loads the tour with `wc360Mode=embedded`, preserving the TV preview, venue buttons, responsive layout, and auto-rotation.
- The `/embed/` route is a tiny iframe wrapper that loads `../index.htm?wc360Mode=embedded&embedVersion=1`.
- Full-mode autoplay now retries the Atrium start path instead of relying on a single trigger call.
- The static overlay video (`video_FEF1B6B4_E5E9_871D_41CA_8E30EADCF75C`) is rendered at reduced opacity so the viewer can show through it.
- Reason: supports separate dropdown-only and embedded experiences while keeping one 3DVista export.
- The per-mode hide/remove lists are intentionally configured in `custom/wc360-mode.js` rather than in generated 3DVista files.

### `responsive-embed-menu`

- Runtime files added: `custom/wc360-responsive-menu.js`.
- Injection point: `index.htm`, immediately after `custom/wc360-menu-autocycle.js`.
- Target UI: exported `Embed_MENU` venue buttons.
- Behavior: applies post-load CSS/DOM positioning only. `ATRIUM`, `LOUNGE`, `SOLDATO`, `SPRING HALL`, and `TENMOMI` are laid into five equal slots across the top edge. `EXTERIOR`, `BLACK BOX`, `RIVOLI THEATER`, and `CINEMA UNDERGROUND` are laid into four equal slots across the bottom edge.
- Reason: uses the same stable slot-based positioning for both rows while avoiding DOM reparenting, measured pixel positioning, and generated definition edits.
- Do not mutate `TDV.PlayerAPI.defineScript` or generated Button definitions for this fix; that can trip 3DVista validation and show the academic watermark.

### `menu-autocycle`

- Runtime files added: `custom/wc360-menu-autocycle.js`.
- Injection point: `index.htm`, immediately after `custom/wc360-mode.js`.
- Target UI: the exported labeled venue buttons that already have 3DVista `rollOver` actions.
- Behavior: automatically starts on page load and triggers each menu item's rollover state in sequence every 5 seconds, which reuses the exported hover behavior that changes the active item to gold/yellow and plays the preview video in viewer 2. Before advancing, it explicitly resets the previous active item and every other menu item so only the currently playing preview stays highlighted.
- User interaction: trusted pointer/mouse/focus entry on any menu item stops the cycle, keeps the hovered item active, and resets the other buttons. Pointer/mouse/focus exit starts the cycle again after 5 seconds, continuing from the hovered item. Touch starts the same pause and schedules a 5-second restart.
- Reason: creates an ambient menu preview loop without editing generated `script_general.js`.

### `video-cover`

- Runtime files added: `custom/wc360-video-cover.js`.
- Injection point: `index.htm`, immediately after `custom/wc360-responsive-menu.js`.
- Behavior: listens for `V` and toggles the visibility of the static overlay video with id `video_FEF1B6B4_E5E9_871D_41CA_8E30EADCF75C`. It also exposes `window.WC360_STATIC_VIDEO_SET()` and `window.WC360_STATIC_VIDEO_TOGGLE()` for debugging.
- Reason: keep the static clip controllable without reintroducing the larger overlay system.
