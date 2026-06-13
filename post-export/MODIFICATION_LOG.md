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
