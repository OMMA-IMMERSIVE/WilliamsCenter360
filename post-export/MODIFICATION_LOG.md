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

- Status: inactive.
- The assets remain in `post-export/assets/`, but `apply-mods.sh` no longer copies or injects them.
- The script still removes any old `WC360_POST_EXPORT:vhs-effect` block from `index.htm` after export.

### `url-mode-wrapper`

- Runtime files added: `custom/wc360-mode.js`.
- Injection point: `index.htm`, immediately after `script.js`.
- Behavior: reads `wc360Mode` or `mode` from the query string/hash and exposes it as `window.WC360_MODE` plus `data-wc360-mode` attributes.
- Default behavior: root/full mode hides the secondary preview viewer, TV border image, and nine venue buttons, leaving the dropdown menu available.
- Embedded behavior: `/embed/` loads the tour with `wc360Mode=embedded`, preserving the TV preview, venue buttons, responsive layout, and auto-rotation.
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
- Behavior: sets every 3DVista `Video` object's scale mode to `fit_outside`, preserving aspect ratio while filling the viewer and cropping the overflowing axis. Native video elements receive equivalent `object-fit: cover` styling.
- Reason: keeps preview videos edge-to-edge at every viewport aspect ratio without stretching them or editing generated tour definitions.
