// Habits Garden — all-JavaScript build (a COPY for the rewrite experiment).
// The live site and the real repo are untouched; this folder is standalone.
// Built from habits-garden-repo @ 16f6668759d5eaddd689f7b2aea03c76881e606e
// by build-copy.py. See REWRITE_NOTES.md.
//
// Order inside this file mirrors the original page:
//   1. the stylesheet, injected as a <style> element,
//   2. the page markup, built into the body,
//   3. the game logic, which runs only after that markup exists
//      (it looks elements up by id, exactly as the original inline
//      script did after the parsed markup).
// The Firebase bridge loads separately as a module (deferred, like the
// original) and the game still tolerates its absence via window.hgCloud.

// ---------- 1. Stylesheet ----------
// The exact text of styles.css, held in a string and injected into the
// head when this script runs. styles.css contains no backtick, ${ or
// backslash, so a template literal holds it byte-for-byte.
const HG_STYLESHEET = `/* Habits Garden — Home Screen (Figma node 1:14). The 256x144 stage
   is scaled by --scale to fit the window exactly (see fitStage). */

:root {
  --bg: #e1bf89;
  /* Default only, for the first paint before the fit code runs:
     fitStage() in index.html replaces this with the scale that
     fits the actual window (1600 × 900 at 6.25). */
  --scale: 6.25;

  --stage-w: calc(256px * var(--scale));
  --stage-h: calc(144px * var(--scale));

  /* column x-positions (Home Screen 2 / Figma node 184:110: 67 / 96.94 / 127.17 / 157) */
  --col-1: calc(67px * var(--scale));
  --col-2: calc(96.94px * var(--scale));
  --col-3: calc(127.17px * var(--scale));
  --col-4: calc(157px * var(--scale));
  --row-top: calc(21px * var(--scale));
  --row-bottom: calc(81px * var(--scale));
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: var(--bg);
}

/* The page is exactly one screen: its height is the viewport's
   height and overflow is hidden, so it can never scroll. The
   garden's size itself comes from --scale, which the fit code in
   index.html sets from the real window size (see fitStage). */
body {
  display: grid;
  place-items: center;
  background: var(--bg);
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.home-screen {
  position: relative;
  width: var(--stage-w);
  height: var(--stage-h);
  overflow: hidden;
  background: var(--bg);
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  flex-shrink: 0;
}

.home-screen img {
  display: block;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.shelf {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--stage-w);
  height: var(--stage-h);
  object-fit: cover;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Pots */
.pot {
  position: absolute;
  width: calc(32px * var(--scale));
  height: calc(32px * var(--scale));
  padding: 0;
  border: 0;
  background-color: transparent;
  background-image: url("assets/pot-template.png");
  background-position: bottom center;
  background-size: contain;
  background-repeat: no-repeat;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  cursor: pointer;
  /* Left/top animate to the resolved spot on drop; disabled while dragging. */
  transition: left 0.18s ease, top 0.18s ease;
}

.pot.pot--white {
  background-image: url("assets/pot-white.png");
}

.pot.pot--blue {
  background-image: url("assets/pot-blue.png");
}

.pot.pot--yellow {
  background-image: url("assets/pot-yellow.png");
}

.pot.pot--orange {
  background-image: url("assets/pot-orange.png");
}

.pot.pot--grey {
  background-image: url("assets/pot-grey.png");
}

.pot.pot--white-smallest {
  background-image: url("assets/pot-smallest-white.png");
}

.pot.pot--orange-smallest {
  background-image: url("assets/pot-smallest-orange.png");
}

.pot.pot--yellow-smallest {
  background-image: url("assets/pot-smallest-yellow.png");
}

.pot.pot--blue-smallest {
  background-image: url("assets/pot-smallest-blue.png");
}

.pot.pot--grey-smallest {
  background-image: url("assets/pot-smallest-grey.png");
}

.pot.pot--orange-smaller {
  background-image: url("assets/pot-smaller-orange.png");
}

.pot.pot--white-smaller {
  background-image: url("assets/pot-smaller-white.png");
}

.pot.pot--blue-smaller {
  background-image: url("assets/pot-smaller-blue.png");
}

.pot.pot--yellow-smaller {
  background-image: url("assets/pot-smaller-yellow.png");
}

.pot.pot--grey-smaller {
  background-image: url("assets/pot-smaller-grey.png");
}

/* Drag-and-drop pots: Pointer Events drive the move (see index.html),
   so touch must not scroll and text must not select mid-drag. */
.pot {
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.pot.is-dragging {
  z-index: 50;
  cursor: grabbing;
  transition: none;
  transform: translateY(calc(-2px * var(--scale)));
}

/* The blocked-drop outline hugs the visible pot sprite, not the
   32-unit button, so it shows the pot's real footprint. The sprite
   sits at the bottom centre of the button: clay 16x13 (left 8),
   white/blue/yellow/orange/grey 12x11 (left 10), the smaller pots
   10x9 (left 11), the smallest pots 8x7 (left 12). */
.pot.is-dragging.is-blocked::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: calc(8px * var(--scale));
  width: calc(16px * var(--scale));
  height: calc(13px * var(--scale));
  outline: 2px dashed #e05656;
}

.pot.pot--white.is-dragging.is-blocked::after,
.pot.pot--blue.is-dragging.is-blocked::after,
.pot.pot--yellow.is-dragging.is-blocked::after,
.pot.pot--orange.is-dragging.is-blocked::after,
.pot.pot--grey.is-dragging.is-blocked::after {
  left: calc(10px * var(--scale));
  width: calc(12px * var(--scale));
  height: calc(11px * var(--scale));
}

.pot.pot--orange-smaller.is-dragging.is-blocked::after,
.pot.pot--white-smaller.is-dragging.is-blocked::after,
.pot.pot--blue-smaller.is-dragging.is-blocked::after,
.pot.pot--yellow-smaller.is-dragging.is-blocked::after,
.pot.pot--grey-smaller.is-dragging.is-blocked::after {
  left: calc(11px * var(--scale));
  width: calc(10px * var(--scale));
  height: calc(9px * var(--scale));
}

.pot.pot--white-smallest.is-dragging.is-blocked::after,
.pot.pot--orange-smallest.is-dragging.is-blocked::after,
.pot.pot--yellow-smallest.is-dragging.is-blocked::after,
.pot.pot--blue-smallest.is-dragging.is-blocked::after,
.pot.pot--grey-smallest.is-dragging.is-blocked::after {
  left: calc(12px * var(--scale));
  width: calc(8px * var(--scale));
  height: calc(7px * var(--scale));
}

.pot:focus-visible {
  outline: 2px dashed #000;
  outline-offset: 2px;
}

.pot--top {
  top: var(--row-top);
}

.pot--bottom {
  top: var(--row-bottom);
}

.pot--c1,
.pot--h1 {
  left: var(--col-1);
}

.pot--c2,
.pot--h2 {
  left: var(--col-2);
}

.pot--c3,
.pot--h3 {
  left: var(--col-3);
}

.pot--c4,
.pot--h4 {
  left: var(--col-4);
}

/* Plant slots (48 × 32, sit above the bottom-row pots) */
.plant {
  position: absolute;
  top: calc(68px * var(--scale));
  width: calc(32px * var(--scale));
  height: calc(48px * var(--scale));
  pointer-events: none;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: bottom center;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.plant--daisy {
  left: calc(35px * var(--scale));
}

.plant--peace-lily {
  left: calc(189px * var(--scale));
}

/* Hint */
.hint {
  position: absolute;
  left: calc(54.68px * var(--scale));
  /* 23px, not 21px: nudged 2 units down — the glyphs sit high in their
     box, so the visible gap to the arrow read ~23px. */
  top: calc(23px * var(--scale));
  margin: 0;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: normal;
  color: #000;
  white-space: nowrap;
  pointer-events: none;
  animation: hint-bob 2s steps(1) infinite;
}

.hint-arrow {
  position: absolute;
  left: calc(79.18px * var(--scale));
  top: calc(29px * var(--scale));
  width: calc(9px * var(--scale));
  height: calc(9px * var(--scale));
  pointer-events: none;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Currency pill: top right corner of the SCREEN, showing today's
   dew drop count in the blank half of the sprite, next to its coin
   and x. The sprite is a 48x32 canvas shown at x0.75 (36x24). Its
   ink (44x16, 2 units of clear canvas on the right = 1.5 at this
   scale) sits 5 units in from the screen's right edge via a 3.5
   right offset (flush would be -1.5; Shusuke asked for 5 left).
   The pill is position:fixed — anchored to the window's
   top-right corner, not the stage's — so on a screen wider or
   taller than the 16:9 garden it hugs the real corner instead of
   floating in from the edge with the letterboxed stage. (On a
   16:9 screen the two corners coincide, so nothing moves there.)
   Both pills' tops were nudged 5 units up at Shusuke's request
   (pill -1, add-pot 13; were 4/18), so the pill's element starts
   1 unit above the window top and its ink sits 4.25 units down.
   Clicking opens the dew drops info card; hovering grows the pill
   a touch (like the add-a-pot button) to show it is clickable.
   Like the add-a-pot button and the sign-in text below it, the
   pill stays hidden until the intro hint flow finishes, then all
   three fade in together. */
.ui-currency {
  position: fixed;
  top: calc(-1px * var(--scale));
  right: calc(3.5px * var(--scale));
  width: calc(36px * var(--scale));
  height: calc(24px * var(--scale));
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.ui-currency.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.ui-currency:hover {
  transform: scale(1.1);
}

.ui-currency-img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* The day's dew drop count, centred on the pill's ink, right-aligned
   into its blank right half. */
.ui-currency-count {
  position: absolute;
  top: calc(11.25px * var(--scale));
  right: calc(4px * var(--scale));
  transform: translateY(-50%);
  font-family: "Tiny5", monospace;
  font-size: calc(8px * var(--scale));
  line-height: 1;
  color: #000;
  pointer-events: none;
}

/* While a dead plant's −2 is part of today's total, the count
   wears the penalty colour. */
.ui-currency-count.is-penalty {
  color: #465456;
}

/* Add-a-pot button: below the currency display, the two sprites'
   visible right edges aligned, 5 units in from the screen's right
   edge (position:fixed like the pill, so the pair stays in the
   window's top-right corner — see .ui-currency). The sprite is a
   28x32 canvas shown at x0.75 (21x24); its ink (23x15, 3 units of
   clear canvas on the right = 2.25 at this scale) needs a 2.75
   right offset to line up with the pill's ink (flush would be
   -2.25; +5 like the pill). The top leaves a 2-unit visible gap
   below the pill's ink. Hidden until the intro hint flow finishes. */
.ui-addplant {
  position: fixed;
  top: calc(13px * var(--scale));
  right: calc(2.75px * var(--scale));
  width: calc(21px * var(--scale));
  height: calc(24px * var(--scale));
  padding: 0;
  border: 0;
  background-color: transparent;
  background-image: url("assets/ui-addplant.png");
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.ui-addplant.is-visible {
  opacity: 1;
  pointer-events: auto;
}

/* Hovering grows the button a touch, like the currency pill, to
   show it is clickable. */
.ui-addplant:hover {
  transform: scale(1.1);
}

/* Account pill: top left of the SCREEN, mirroring the currency
   pill at the top right — same element top (-1), and its ink sits
   the same 5 units in from its screen edge and 4.25 units down
   (the sprite is a 28x32 canvas shown at x0.75 like the add-pot
   button; its 16x15 ink starts 7,7 in the canvas, i.e. 5.25
   units into the element, so the element's left is -0.25).
   Unlike the rest of the corner UI, the pill is visible from the
   start. Clicking it opens the sign-in page; hovering grows it a
   touch, like the other pills. */
.ui-account {
  position: fixed;
  top: calc(-1px * var(--scale));
  left: calc(-0.25px * var(--scale));
  width: calc(21px * var(--scale));
  height: calc(24px * var(--scale));
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.ui-account:hover {
  transform: scale(1.1);
}

.ui-account-img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Sign-in text: beside the account pill, inside a slot clipped
   at the pill's ink right edge (17 units), so the text can
   scroll out of the pill and back into it. The text rests 2
   units right of the pill's ink. It starts parked inside the
   pill (translated left past the slot's edge, so the clip hides
   it); when the intro hint flow finishes it scrolls left to
   right into place, together with the pills appearing. Once
   signed in, the "signed in as …" text scrolls right to left
   back into the pill after 3 seconds (the accounts code adds
   .is-out on a timer) and stays there. The scroll speed is
   constant — a linear transition, no easing — at x0.75 of the
   first try (0.8s across the text's width; Shusuke's requests).
   Clicking the text opens the sign-in page; while signed in,
   the text shows the account instead. */
.ui-signin-slot {
  position: fixed;
  left: calc(17px * var(--scale));
  /* The text is centred on the pill: the pill's ink centre is at
     4.25 + 11.25/2 = 9.875 units, the text's glyphs are ~6.06
     tall starting ~0.45 below the element's top, so the element
     sits at 9.875 - 6.06/2 - 0.45 = 6.4. */
  top: calc(6.4px * var(--scale));
  overflow: hidden;
}

.ui-signin {
  display: block;
  margin-left: calc(2px * var(--scale));
  padding: 0;
  border: 0;
  background: none;
  font-family: "Tiny5", monospace;
  font-size: calc(7px * var(--scale));
  line-height: 1;
  color: #000;
  white-space: nowrap;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: translateX(calc(-100% - 2px * var(--scale)));
  transition: transform 0.8s linear, opacity 0.2s ease;
}

.ui-signin.is-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}

.ui-signin:hover {
  text-decoration: underline;
}

.ui-signin.is-out {
  transform: translateX(calc(-100% - 2px * var(--scale)));
  pointer-events: none;
}

/* Drag-to-delete marker: floats above the dragged pot's starting
   spot for the length of a drag; dropping the pot on it deletes the
   pot. The sprite is a 55x55 canvas with a centred 25x25 X, shown
   at 13.2x13.2 so the visible X is 6x6. JS sets left/top per drag.
   Sits above the dragged pot (z-index 50), below the modals. */
.drag-delete-x {
  position: absolute;
  width: calc(13.2px * var(--scale));
  height: calc(13.2px * var(--scale));
  background: url("assets/ui-tiny-x.png") center / contain no-repeat;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.1s ease;
  z-index: 60;
}

.drag-delete-x.is-visible {
  opacity: 1;
}

.drag-delete-x.is-armed {
  transform: scale(1.3);
  filter: drop-shadow(0 0 3px rgba(224, 86, 86, 0.9));
}

/* Dew Drops info card: opened from the currency pill. Built on the
   Add Plant modal's panel background (ui-plant-1) and geometry,
   with the same rise/fall animations. */
.dd-modal {
  position: absolute;
  inset: 0;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(10px);
}

.dd-modal.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  animation: ap-rise-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.dd-modal.is-closing,
.dd-modal.is-closing * {
  pointer-events: none !important;
}

.dd-modal.is-closing {
  visibility: visible;
  animation: ap-fall-fade-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.dd-container {
  position: absolute;
  inset: 0;
}

.dd-panel {
  position: absolute;
  left: calc(10px * var(--scale));
  top: calc(10px * var(--scale));
  width: calc(236px * var(--scale));
  height: calc(124px * var(--scale));
  object-fit: cover;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.dd-title {
  position: absolute;
  left: calc(21px * var(--scale));
  top: calc(17px * var(--scale));
  margin: 0;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(10px * var(--scale));
  line-height: normal;
  white-space: nowrap;
  color: #000;
  z-index: 2;
}

.dd-close {
  position: absolute;
  left: calc(var(--stage-w) * 0.8 + 23.42px * var(--scale));
  top: calc(16.53px * var(--scale));
  width: calc(11px * var(--scale));
  height: calc(11px * var(--scale));
  padding: 0;
  border: 0;
  background: url("assets/ui-tiny-x.png") center / contain no-repeat;
  cursor: pointer;
  z-index: 2;
}

.dd-body {
  position: absolute;
  left: calc(21px * var(--scale));
  top: calc(34px * var(--scale));
  width: calc(214px * var(--scale));
  font-family: "Tiny5", monospace;
  font-size: calc(7px * var(--scale));
  line-height: 1.25;
  color: #000;
  z-index: 2;
}

.dd-line {
  display: flex;
  align-items: flex-start;
  gap: calc(2px * var(--scale));
  margin: 0 0 calc(2.5px * var(--scale));
}

/* The drop1 sprite is a 4x4 drop in a 16x16 canvas, so the box is
   drawn 14 units wide for a ~3.5-unit visible drop. */
.dd-bullet {
  flex: none;
  width: calc(14px * var(--scale));
  height: calc(14px * var(--scale));
  margin-top: calc(-3.5px * var(--scale));
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Dew collection: the drop icon hovering over a plant that has
   drops waiting, the little drops scattered on it, the drop(s)
   that fly to the currency pill when collected, and the pill's
   pop when they land. The icon's visible drop is ~1/4 of its
   box (4x4 ink in a 16x16 canvas), so the box is 16 units for a
   ~4-unit drop; the scatter drops are single pixels in 16x16
   canvases and are sized per-drop from JS (16x the dot size). */
.dew-icon {
  position: absolute;
  left: 50%;
  width: calc(16px * var(--scale));
  height: calc(16px * var(--scale));
  cursor: pointer;
  z-index: 5;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  animation: dew-bob 2.2s ease-in-out infinite;
}

@keyframes dew-bob {
  0%,
  100% {
    transform: translate(-50%, 0);
  }

  50% {
    transform: translate(-50%, calc(-1.5px * var(--scale)));
  }
}

.dew-effect {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}

.dew-drop {
  position: absolute;
  pointer-events: none;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  animation-name: dew-pulse;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

@keyframes dew-pulse {
  from {
    transform: scale(0.8);
  }

  to {
    transform: scale(1.2);
  }
}

.dew-flyer {
  position: fixed;
  pointer-events: none;
  z-index: 200;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ui-currency.is-pop {
  animation: dew-pill-pop 0.35s ease;
}

@keyframes dew-pill-pop {
  40% {
    transform: scale(1.22);
  }
}

/* Sign In page: opened from the sign-in text at the top centre.
   Same panel, geometry and animations as the Dew Drops card. */
.si-modal {
  position: absolute;
  inset: 0;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(10px);
}

.si-modal.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  animation: ap-rise-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.si-modal.is-closing,
.si-modal.is-closing * {
  pointer-events: none !important;
}

.si-modal.is-closing {
  visibility: visible;
  animation: ap-fall-fade-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.si-container {
  position: absolute;
  inset: 0;
}

.si-panel {
  position: absolute;
  left: calc(10px * var(--scale));
  top: calc(10px * var(--scale));
  width: calc(236px * var(--scale));
  height: calc(124px * var(--scale));
  object-fit: cover;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.si-title {
  position: absolute;
  left: calc(21px * var(--scale));
  top: calc(17px * var(--scale));
  margin: 0;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(10px * var(--scale));
  line-height: normal;
  white-space: nowrap;
  color: #000;
  z-index: 2;
}

.si-close {
  position: absolute;
  left: calc(var(--stage-w) * 0.8 + 23.42px * var(--scale));
  top: calc(16.53px * var(--scale));
  width: calc(11px * var(--scale));
  height: calc(11px * var(--scale));
  padding: 0;
  border: 0;
  background: url("assets/ui-tiny-x.png") center / contain no-repeat;
  cursor: pointer;
  z-index: 2;
}

.si-form,
.si-account {
  position: absolute;
  left: calc(21px * var(--scale));
  top: calc(34px * var(--scale));
  width: calc(214px * var(--scale));
  font-family: "Tiny5", monospace;
  font-size: calc(7px * var(--scale));
  line-height: 1.45;
  color: #000;
  z-index: 2;
}

/* The account view reaches the panel's bottom edge (34 + 100 =
   134) so the sign-out button can anchor to it: centred on the
   panel (the view is centred on it too), 4 units up from the
   bottom. */
.si-account {
  height: calc(100px * var(--scale));
}

.si-account .si-btn {
  position: absolute;
  left: 50%;
  bottom: calc(4px * var(--scale));
  transform: translateX(-50%);
}

.si-form[hidden],
.si-account[hidden] {
  display: none;
}

/* The Google button sits in the flow under the "Already have
   a garden?" line, 2 units below it and with its left edge
   aligned with the text (the body lines are indented by the
   2-character tab, 6.3 units). */
#si-google {
  margin-top: calc(2px * var(--scale));
  margin-left: calc(6.3px * var(--scale));
}

.si-status {
  height: calc(10px * var(--scale));
  margin: calc(4px * var(--scale)) 0;
  /* Aligned with the body text and the button: the same
     6.3-unit indent. */
  margin-left: calc(6.3px * var(--scale));
  color: #000;
}

.si-status.is-error {
  color: #e05656;
}

.si-btn {
  padding: calc(2px * var(--scale)) calc(8px * var(--scale));
  border: calc(1px * var(--scale)) solid rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.4);
  font-family: "Tiny5", monospace;
  font-size: calc(7px * var(--scale));
  color: #000;
  cursor: pointer;
}

.si-btn + .si-btn {
  margin-left: calc(6px * var(--scale));
}

.si-line {
  margin: 0 0 calc(5px * var(--scale));
  /* A tab space before the body text (2 characters wide). */
  text-indent: calc(6.3px * var(--scale));
}

/* "your plants are saved to your account." sits 6 units higher,
   a size smaller, in the tiny X's brown. */
.si-line--saved {
  margin-top: calc(-6px * var(--scale));
  font-size: calc(6px * var(--scale));
  color: #bda499;
}



/* ---------- Home Screen 2 (Figma node 184:110) ----------
   Narrower shelf, pots re-spaced and shifted toward the centre. */
.home-2 .pot--h1,
.home-2 .pot--c1 {
  left: calc(67px * var(--scale));
}

.home-2 .pot--h2,
.home-2 .pot--c2 {
  left: calc(96.94px * var(--scale));
}

.home-2 .pot--h3,
.home-2 .pot--c3 {
  left: calc(127.17px * var(--scale));
}

.home-2 .pot--h4,
.home-2 .pot--c4 {
  left: calc(157px * var(--scale));
}

.home-2 .plant--daisy {
  left: calc(35px * var(--scale));
}

.home-2 .plant--peace-lily {
  left: calc(189px * var(--scale));
}

.home-2 .hint {
  left: calc(54.68px * var(--scale));
}

.home-2 .hint-arrow {
  left: calc(79.18px * var(--scale));
}

@keyframes hint-bob {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(calc(-1px * var(--scale)));
  }
}

/* ---------- Add Plant Popup Modal (Figma node 71:38) ---------- */

@keyframes ap-rise-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ap-fall-fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(10px);
  }
}

.ap-modal {
  position: absolute;
  inset: 0;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(10px);
}

.ap-modal.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  animation: ap-rise-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.ap-modal.is-closing,
.ap-modal.is-closing * {
  pointer-events: none !important;
}

.ap-modal.is-closing {
  visibility: visible;
  animation: ap-fall-fade-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.ap-container {
  position: absolute;
  inset: 0;
}

.ap-container button {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ap-container button:focus-visible,
.ap-input:focus-visible {
  outline: 2px dashed #000;
  outline-offset: 2px;
}

.ap-panel {
  position: absolute;
  left: calc(10px * var(--scale));
  top: calc(10px * var(--scale));
  width: calc(236px * var(--scale));
  height: calc(124px * var(--scale));
  object-fit: cover;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  pointer-events: auto;
}

.ap-header {
  position: absolute;
  left: calc(21px * var(--scale));
  top: calc(17px * var(--scale));
  display: flex;
  align-items: baseline;
  gap: 1ch;
  z-index: 2;
  font-family: "Tiny5", monospace;
  font-size: calc(10px * var(--scale));
}

.ap-title {
  position: static;
  margin: 0;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(10px * var(--scale));
  line-height: normal;
  white-space: nowrap;
  color: #000;
}

.ap-remove {
  position: static;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font-family: "Tiny5", monospace;
  font-size: calc(5px * var(--scale));
  line-height: normal;
  color: #bda499;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.ap-remove:hover {
  color: #000;
}

.ap-remove.is-confirming,
.ap-remove.is-confirming:hover {
  color: #e05656;
}

.ap-remove:focus-visible {
  outline: 1px dashed #e05656;
  outline-offset: 1px;
}

.ap-remove[hidden] {
  display: none !important;
}

.ap-label,
.ap-input {
  position: absolute;
  margin: 0;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  line-height: normal;
  white-space: nowrap;
  color: #000;
}

.ap-label {
  font-size: calc(7px * var(--scale));
}

.ap-label--name {
  left: calc(23px * var(--scale));
  top: calc(32px * var(--scale));
}

.ap-label--choose {
  left: calc(23px * var(--scale));
  top: calc(56px * var(--scale));
}

.ap-input {
  left: calc(var(--stage-w) * 0.2 + 10.8px * var(--scale));
  top: calc(32px * var(--scale));
  width: calc(120px * var(--scale));
  height: calc(9px * var(--scale));
  line-height: normal;
  padding: 0;
  border: 0;
  background: none;
  font-size: calc(7px * var(--scale));
}

.ap-input::placeholder {
  color: #bda499;
  opacity: 1;
}

.ap-input:focus {
  outline: none;
}

/* Repeat row with auto-adjusting right arrow & custom days selector */
.ap-repeat-row {
  position: absolute;
  left: calc(23px * var(--scale));
  top: calc(44px * var(--scale));
  height: calc(7px * var(--scale));
  display: flex;
  align-items: center;
  z-index: 2;
}

.ap-repeat-row .ap-label--repeat {
  position: static;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: normal;
  white-space: nowrap;
  color: #000;
  min-width: calc(21px * var(--scale));
}

.ap-repeat-control {
  display: inline-flex;
  align-items: center;
  height: calc(7px * var(--scale));
  gap: calc(3px * var(--scale));
  margin-left: calc(5px * var(--scale));
}

.ap-repeat-control .ap-step,
.ap-month-control .ap-step {
  position: static;
  width: calc(7px * var(--scale));
  height: calc(7px * var(--scale));
  flex-shrink: 0;
  background: url("assets/ui-tiny-button-1.png") center / contain no-repeat !important;
  cursor: pointer;
}

.ap-repeat-control .ap-step--prev,
.ap-month-control .ap-step--prev {
  transform: scaleX(-1);
}

.ap-repeat-control .ap-repeat-value {
  position: static;
  display: inline-block;
  width: calc(33px * var(--scale));
  text-align: center;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: 1;
  color: #000;
  white-space: nowrap;
  user-select: none;
}

/* Custom days of the week picker (matching screenshot) */
.ap-days-picker {
  display: inline-flex;
  align-items: center;
  height: calc(7px * var(--scale));
  gap: calc(4px * var(--scale));
  margin-left: calc(8px * var(--scale));
  user-select: none;
}

.ap-days-picker[hidden] {
  display: none !important;
}

.ap-day-btn {
  padding: 0;
  border: 0;
  background: none;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: 1;
  color: #bda499;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.12s ease;
}

.ap-day-btn:hover {
  color: #8b7367;
}

.ap-day-btn.is-active {
  color: #000;
}

.ap-day-btn.is-active:hover {
  color: #222;
}

.ap-day-btn:focus-visible {
  outline: 1px dashed #000;
  outline-offset: 1px;
}

/* Monthly day of month picker */
.ap-monthly-picker {
  display: inline-flex;
  align-items: center;
  height: calc(7px * var(--scale));
  gap: calc(2px * var(--scale));
  margin-left: calc(8px * var(--scale));
  user-select: none;
}

.ap-monthly-picker[hidden] {
  display: none !important;
}

.ap-monthly-text,
.ap-ordinal-suffix {
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: 1;
  color: #000;
  white-space: nowrap;
}

.ap-day-num-input {
  width: calc(14px * var(--scale));
  height: calc(7px * var(--scale));
  padding: 0;
  border: 0;
  background: none;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: 1;
  color: #000;
  text-align: center;
}

.ap-day-num-input::placeholder {
  color: #bda499;
  opacity: 1;
}

.ap-day-num-input:focus {
  outline: none;
}

.ap-day-num-input:focus-visible {
  outline: 1px dashed #bda499;
  outline-offset: 1px;
}

/* Yearly date picker */
.ap-yearly-picker {
  display: inline-flex;
  align-items: center;
  height: calc(7px * var(--scale));
  gap: calc(2px * var(--scale));
  margin-left: calc(8px * var(--scale));
  user-select: none;
}

.ap-yearly-picker[hidden] {
  display: none !important;
}

.ap-yearly-text {
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: 1;
  color: #000;
  white-space: nowrap;
}

.ap-month-control {
  display: inline-flex;
  align-items: center;
  height: calc(7px * var(--scale));
  gap: calc(2px * var(--scale));
}

.ap-month-value {
  display: inline-block;
  min-width: calc(18px * var(--scale));
  text-align: center;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: 1;
  color: #000;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

/* Close button (11 × 11) */
.ap-close {
  position: absolute;
  left: calc(var(--stage-w) * 0.8 + 23.42px * var(--scale));
  top: calc(16.53px * var(--scale));
  width: calc(11px * var(--scale));
  height: calc(11px * var(--scale));
  background: url("assets/ui-tiny-x.png") center / contain no-repeat !important;
}

/* Carousel arrows (11 × 11) */
.ap-arrow {
  position: absolute;
  top: calc(86px * var(--scale));
  width: calc(11px * var(--scale));
  height: calc(11px * var(--scale));
  background: url("assets/ui-tiny-arrow-1.png") center / contain no-repeat !important;
}

.ap-arrow--prev {
  left: calc(24px * var(--scale));
  transform: scaleX(-1);
}

.ap-arrow--next {
  left: calc(var(--stage-w) * 0.8 + 14.2px * var(--scale));
}

/* Mini steppers for pot style (7 × 7) */
.ap-mini {
  position: absolute;
  width: calc(7px * var(--scale));
  height: calc(7px * var(--scale));
  background: url("assets/ui-tiny-button-1.png") center / contain no-repeat !important;
  border: 0;
  padding: 0;
  cursor: pointer;
  z-index: 2;
}

.ap-mini--prev {
  left: calc(26.98px * var(--scale));
  top: calc(103.06px * var(--scale));
  transform: scaleX(-1);
}

.ap-mini--next {
  left: calc(var(--stage-w) * 0.8 + 15.19px * var(--scale));
  top: calc(102.91px * var(--scale));
}

/* Plant carousel viewport & track */
.ap-carousel-viewport {
  position: absolute;
  left: calc(39px * var(--scale));
  top: 0;
  width: calc(176px * var(--scale));
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 2;
}

.ap-carousel-track {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.ap-carousel-track>* {
  pointer-events: auto;
}

/* Plant choices */
.ap-plant {
  position: absolute;
  width: calc(32px * var(--scale));
  border-radius: 4px;
  cursor: pointer;
  background: none;
  border: 0;
  padding: 0;
  transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.ap-plant.is-selected {
  outline: none;
  transform: translateY(calc(-5px * var(--scale)));
}

.ap-plant img {
  display: block;
  width: 100%;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ap-plant-sprite {
  position: absolute;
  left: 0;
  bottom: calc(13px * var(--scale));
  width: 100%;
  height: auto;
}

.ap-carousel-track.is-white-pot .ap-plant-sprite {
  bottom: calc(11px * var(--scale));
}

.ap-carousel-track.is-short-pot .ap-plant-sprite {
  bottom: calc(11px * var(--scale));
}

.ap-carousel-track.is-small-pot .ap-plant-sprite {
  bottom: calc(7px * var(--scale));
  width: 50%;
  left: calc(8px * var(--scale));
}

.ap-carousel-track.is-smaller-pot .ap-plant-sprite {
  bottom: calc(9px * var(--scale));
  width: 75%;
  left: calc(4px * var(--scale));
}

.ap-plant-pot {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: calc(13px * var(--scale));
}

.ap-carousel-track.is-white-pot .ap-plant-pot {
  height: calc(11px * var(--scale));
}

.ap-carousel-track.is-short-pot .ap-plant-pot {
  height: calc(11px * var(--scale));
}

.ap-carousel-track.is-small-pot .ap-plant-pot {
  height: calc(7px * var(--scale));
}

.ap-carousel-track.is-smaller-pot .ap-plant-pot {
  height: calc(9px * var(--scale));
}

/* Centre the peace lily in the plant picker: its ink centre sits
   1.0 unit right of the pot rim centre (17.0 vs 16.0) after the sprite
   was shifted +1 in the file, so shift it left 1.0 to centre it exactly. */
.ap-plant--lily .ap-plant-sprite {
  left: calc(-1px * var(--scale));
}

.ap-carousel-track.is-small-pot .ap-plant--lily .ap-plant-sprite {
  left: calc(7.5px * var(--scale));
}

.ap-carousel-track.is-smaller-pot .ap-plant--lily .ap-plant-sprite {
  left: calc(3.25px * var(--scale));
}

/* Carousel slots, left to right in picker order: cactus, droopy,
   tree, lily, daisy, lavender. These left offsets ARE the visible
   order — the buttons are absolutely positioned, so rearranging
   the markup alone does not move them; swap the offsets too. */
.ap-plant--cactus {
  left: 0;
  top: calc(71px * var(--scale));
  height: calc(45px * var(--scale));
}

.ap-plant--lavender {
  left: calc(180px * var(--scale));
  top: calc(55px * var(--scale));
  height: calc(61px * var(--scale));
}

.ap-plant--tree {
  left: calc(72px * var(--scale));
  top: calc(55px * var(--scale));
  height: calc(61px * var(--scale));
}

.ap-plant--lily {
  left: calc(108px * var(--scale));
  top: calc(55px * var(--scale));
  height: calc(61px * var(--scale));
}

.ap-plant--daisy {
  left: calc(144px * var(--scale));
  top: calc(55px * var(--scale));
  height: calc(61px * var(--scale));
}

.ap-plant--droopy {
  left: calc(36px * var(--scale));
  top: calc(55px * var(--scale));
  height: calc(61px * var(--scale));
}

/* Commit button */
.ap-commit {
  position: absolute;
  left: calc(var(--stage-w) * 0.4 + 13.1px * var(--scale));
  top: calc(120.63px * var(--scale));
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: normal;
  white-space: nowrap;
  color: #bda499;
  /* greyed out like the x button */
  background: none;
  border: 0;
  padding: 0;
  cursor: not-allowed;
  user-select: none;
  transition: color 0.15s ease;
  z-index: 2;
}

.ap-commit.is-ready {
  color: #000;
  /* black like the design provided */
  cursor: pointer;
}

.ap-commit:focus-visible {
  outline: 1px dashed #000;
  outline-offset: 2px;
}

/* Planted pot preview on shelf */
/* Keep the default pot-template.png background visible under the plant sprite */
/* PLANT BOTTOM*/

.pot-plant {
  position: absolute;
  bottom: calc(13px * var(--scale));
  left: 0;
  width: 100%;
  height: auto;
  pointer-events: none;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.pot.pot--white .pot-plant {
  bottom: calc(11px * var(--scale));
}

.pot.pot--blue .pot-plant,
.pot.pot--yellow .pot-plant,
.pot.pot--orange .pot-plant,
.pot.pot--grey .pot-plant {
  bottom: calc(11px * var(--scale));
}

/* The smallest pots are only 7 units tall, and plants on them render
   at 0.5 size: 50% width, centred (left 8px of the 32-wide pot),
   sitting on the 7-unit rim. Width-based, not transform, so it can't
   fight the plant-grow animation, which owns transform. The bud/lily
   centring offsets scale too (bud 0.25 instead of 0.5; lily 0.5 instead of 1.0). */
.pot.pot--white-smallest .pot-plant,
.pot.pot--orange-smallest .pot-plant,
.pot.pot--yellow-smallest .pot-plant,
.pot.pot--blue-smallest .pot-plant,
.pot.pot--grey-smallest .pot-plant {
  bottom: calc(7px * var(--scale));
  width: 50%;
  left: calc(8px * var(--scale));
}

.pot.pot--white-smallest .pot-plant[src*="bud-4.png"],
.pot.pot--orange-smallest .pot-plant[src*="bud-4.png"],
.pot.pot--yellow-smallest .pot-plant[src*="bud-4.png"],
.pot.pot--blue-smallest .pot-plant[src*="bud-4.png"],
.pot.pot--grey-smallest .pot-plant[src*="bud-4.png"],
.pot.pot--white-smallest .pot-plant[src*="dead-bud.png"],
.pot.pot--orange-smallest .pot-plant[src*="dead-bud.png"],
.pot.pot--yellow-smallest .pot-plant[src*="dead-bud.png"],
.pot.pot--blue-smallest .pot-plant[src*="dead-bud.png"],
.pot.pot--grey-smallest .pot-plant[src*="dead-bud.png"] {
  left: calc(8.25px * var(--scale));
}

.pot.pot--white-smallest .pot-plant[src*="peace-lily"],
.pot.pot--orange-smallest .pot-plant[src*="peace-lily"],
.pot.pot--yellow-smallest .pot-plant[src*="peace-lily"],
.pot.pot--blue-smallest .pot-plant[src*="peace-lily"],
.pot.pot--grey-smallest .pot-plant[src*="peace-lily"] {
  left: calc(7.5px * var(--scale));
}

/* The smaller pots are 9 units tall, and plants on them render at
   0.75 size: 75% width, centred (left 4px of the 32-wide pot),
   sitting on the 9-unit rim. The bud/lily centring offsets scale too
   (bud 0.375 instead of 0.5; lily 0.75 instead of 1.0). */
.pot.pot--orange-smaller .pot-plant,
.pot.pot--white-smaller .pot-plant,
.pot.pot--blue-smaller .pot-plant,
.pot.pot--yellow-smaller .pot-plant,
.pot.pot--grey-smaller .pot-plant {
  bottom: calc(9px * var(--scale));
  width: 75%;
  left: calc(4px * var(--scale));
}

.pot.pot--orange-smaller .pot-plant[src*="bud-4.png"],
.pot.pot--white-smaller .pot-plant[src*="bud-4.png"],
.pot.pot--blue-smaller .pot-plant[src*="bud-4.png"],
.pot.pot--yellow-smaller .pot-plant[src*="bud-4.png"],
.pot.pot--grey-smaller .pot-plant[src*="bud-4.png"],
.pot.pot--orange-smaller .pot-plant[src*="dead-bud.png"],
.pot.pot--white-smaller .pot-plant[src*="dead-bud.png"],
.pot.pot--blue-smaller .pot-plant[src*="dead-bud.png"],
.pot.pot--yellow-smaller .pot-plant[src*="dead-bud.png"],
.pot.pot--grey-smaller .pot-plant[src*="dead-bud.png"] {
  left: calc(4.375px * var(--scale));
}

.pot.pot--orange-smaller .pot-plant[src*="peace-lily"],
.pot.pot--white-smaller .pot-plant[src*="peace-lily"],
.pot.pot--blue-smaller .pot-plant[src*="peace-lily"],
.pot.pot--yellow-smaller .pot-plant[src*="peace-lily"],
.pot.pot--grey-smaller .pot-plant[src*="peace-lily"] {
  left: calc(3.25px * var(--scale));
}

/* Centre bud / dead-bud / peace-lily sprites over the pot rim.
   Pot rim centre is 16.0 of the 32-wide pot box; bud and dead-bud
   artwork centres are 15.5 (shift right 0.5); the peace lily's ink
   centre is 17.0 after its +1 shift in the sprite file, so shift it
   left 1.0 to centre it exactly. CSS offsets only. */
.pot-plant[src*="bud-4.png"],
.pot-plant[src*="dead-bud.png"] {
  left: calc(0.5px * var(--scale));
}

.pot-plant[src*="peace-lily"] {
  left: calc(-1px * var(--scale));
}


@keyframes plant-grow {
  0% {
    transform: scale(0.85);
    opacity: 0.7;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.plant-growing {
  animation: plant-grow 0.45s ease-out forwards;
  transform-origin: bottom center;
}

/* ---------- Plant Details Popup Modal ---------- */
.pd-modal {
  position: absolute;
  inset: 0;
  z-index: 90;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.pd-modal.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.pd-dialog {
  position: absolute;
  width: calc(236px * var(--scale));
  height: calc(124px * var(--scale));
  pointer-events: none;
}

.pd-dialog>* {
  pointer-events: auto;
}

.pd-bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.pd-content {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pd-content>* {
  pointer-events: auto;
}

.pd-bar {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.pd-title,
.pd-repeat,
.pd-today {
  position: absolute;
  margin: 0;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  line-height: normal;
  white-space: nowrap;
}

.pd-title {
  left: calc(61px * var(--scale));
  top: calc(42px * var(--scale));
  width: calc(122px * var(--scale));
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  font-size: calc(10px * var(--scale));
  color: #000;
}

.pd-title::-webkit-scrollbar {
  display: none;
}

.pd-title.is-dragging {
  cursor: grabbing;
}

.pd-title-line {
  display: inline-block;
  white-space: nowrap;
}

.pd-title-status {
  font-size: 0.5em;
  vertical-align: baseline;
  color: inherit;
  margin-left: calc(2px * var(--scale));
}

.pd-repeat {
  left: calc(61px * var(--scale));
  top: calc(53px * var(--scale));
  font-size: calc(7px * var(--scale));
  color: #000;
}

.pd-today {
  left: calc(156px * var(--scale));
  top: calc(63px * var(--scale));
  font-size: calc(5px * var(--scale));
  color: #bda499;
}

.pd-streak {
  margin: 0;
  padding: 0;
  list-style: none;
}

.pd-streak-day {
  position: absolute;
  top: calc(70px * var(--scale));
  width: calc(11px * var(--scale));
  height: calc(11px * var(--scale));
}

.pd-streak-day img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.pd-streak-day--1 {
  left: calc(72px * var(--scale));
}

.pd-streak-day--2 {
  left: calc(84px * var(--scale));
}

.pd-streak-day--3 {
  left: calc(96px * var(--scale));
}

.pd-streak-day--4 {
  left: calc(108px * var(--scale));
}

.pd-streak-day--5 {
  left: calc(120px * var(--scale));
}

.pd-streak-day--6 {
  left: calc(132px * var(--scale));
}

.pd-streak-day--7 {
  left: calc(144px * var(--scale));
}

.pd-streak-day--8 {
  left: calc(156px * var(--scale));
}

.pd-water {
  position: absolute;
  left: calc(90px * var(--scale));
  top: calc(80px * var(--scale));
  width: calc(56px * var(--scale));
  height: calc(32px * var(--scale));
  padding: 0;
  border: 0;
  background: url("assets/water-button.png") center / contain no-repeat !important;
  cursor: pointer;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  transition: transform 0.1s ease, filter 0.15s ease;
}

.pd-water:hover {
  transform: scale(1.04);
}

.pd-water:active {
  transform: scale(0.96);
}

.pd-water:focus-visible {
  outline: 1px dashed #000;
  outline-offset: 1px;
}

.pd-water.is-watered {
  filter: grayscale(0.35) opacity(0.75);
}

.pd-actions {
  position: absolute;
  left: calc(146px * var(--scale));
  top: calc(98px * var(--scale));
  white-space: pre;
  font-family: "Tiny5", monospace;
  font-size: calc(5px * var(--scale));
  line-height: normal;
  color: #bda499;
}

/* "unwater" sits left of the water button, clear of the streak
   row (y 70-81) and the title/repeat text above. Right-anchored so
   its right edge stays just left of the water button.
   Explicit Tiny5 font: unlike edit/remove it is a direct child of
   .pd-content, not .pd-actions, so it cannot inherit the font from
   there — without this it fell back to the browser default serif. */
.pd-unwater {
  position: absolute;
  right: calc(147px * var(--scale) - 4px);
  top: calc(98px * var(--scale));
  padding: 0;
  border: 0;
  background: none;
  font-family: "Tiny5", monospace;
  font-size: calc(5px * var(--scale));
  line-height: normal;
  color: #bda499;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.12s ease;
}

.pd-edit,
.pd-remove {
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  cursor: pointer;
  line-height: inherit;
  white-space: nowrap;
  transition: color 0.12s ease;
}

.pd-edit:hover {
  color: #000;
}

.pd-edit:focus-visible {
  outline: 1px dashed #000;
  outline-offset: 1px;
}

.pd-remove:hover {
  color: #000;
}

.pd-unwater:hover {
  color: #000;
}

.pd-unwater:focus-visible {
  outline: 1px dashed #000;
  outline-offset: 1px;
}

.pd-remove.is-confirming,
.pd-remove.is-confirming:hover {
  color: #e05656;
}

.pd-remove:focus-visible {
  outline: 1px dashed #e05656;
  outline-offset: 1px;
}

/* Watering Animation */
.watering-anim {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 30;
}

.water-drop {
  position: absolute;
  top: calc(-16px * var(--scale));
  width: calc(1px * var(--scale));
  height: calc(2.5px * var(--scale));
  background: #5caef8;
  border-radius: 1px;
  opacity: 0;
  animation: water-fall 0.65s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
}

@keyframes water-fall {
  0% {
    opacity: 0;
    transform: translateY(0);
  }

  25% {
    opacity: 0.95;
  }

  85% {
    opacity: 0.95;
    transform: translateY(calc(30px * var(--scale)));
  }

  100% {
    opacity: 0;
    transform: translateY(calc(34px * var(--scale))) scaleX(2) scaleY(0.4);
  }
}

/* Sparkle Animation */
.sparkle-anim {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 35;
}

.sparkle {
  position: absolute;
  width: calc(32px * var(--scale));
  height: calc(32px * var(--scale));
  margin-left: calc(-16px * var(--scale));
  margin-top: calc(-16px * var(--scale));
  pointer-events: none;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  animation: sparkle-fade-shift 1.35s ease-out forwards;
}

@keyframes sparkle-fade-shift {
  0% {
    opacity: 0;
    transform: translate(0, 0);
  }

  33.33% {
    opacity: 1;
  }

  57.33% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(var(--dx, 0px), var(--dy, 0px));
  }
}

/* No fixed responsive scale steps: fitStage() in index.html sets
   --scale from the real window size, so every window size fits. */

/* Add-a-bin button: LEFT of the add-a-pot button, on the same
   row (top 13, so the two buttons' inks line up — both sprites
   start their ink 7 down the canvas). Same 28x32 canvas shown
   at x0.75 (21x24); its ink is 18x15 with 8 units of clear
   canvas on the right (= 6 at this scale). A right offset of
   18.5 aligns this button's left edge with the currency
   pill's left edge (the pill spans 3.5 to 39.5 units in from
   the right; both sprites' ink starts 2 into the canvas, so
   the ink left edges line up too). Hidden until the intro
   hint flow finishes, like the rest of the corner stack. */
.ui-addbin {
  position: fixed;
  top: calc(13px * var(--scale));
  right: calc(18.5px * var(--scale));
  width: calc(21px * var(--scale));
  height: calc(24px * var(--scale));
  padding: 0;
  border: 0;
  background-color: transparent;
  background-image: url("assets/ui-addbin.png");
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.ui-addbin.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.ui-addbin:hover {
  transform: scale(1.1);
}

/* Bins on the shelf: a 32x48 jar sprite (the position is set
   from JS: left on a shelf slot, top 14 above the row so the
   jar lands on the shelf line). A bin with a flower wears the
   placeholder flower sprite (the jar with its stem) instead. */
.bin {
  position: absolute;
  width: calc(32px * var(--scale));
  height: calc(48px * var(--scale));
  padding: 0;
  border: 0;
  background-color: transparent;
  background-image: url("assets/bin1.png");
  background-position: bottom center;
  background-size: contain;
  background-repeat: no-repeat;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  cursor: pointer;
  /* Left/top animate to the resolved spot on drop, like the
     pots; disabled while dragging. Pointer Events drive the
     drag, so touch must not scroll and text must not select. */
  transition: left 0.18s ease, top 0.18s ease;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.bin.has-flower {
  background-image: url("assets/bin-yellow-flower.png");
}

/* Every petal picked: only the stem is left in the jar. */
.bin.has-flower.is-stem {
  background-image: url("assets/bin-stem.png");
}

.bin:focus-visible {
  outline: 2px dashed #000;
  outline-offset: 2px;
}

.bin.is-dragging {
  z-index: 50;
  cursor: grabbing;
  transition: none;
  transform: translateY(calc(-2px * var(--scale)));
}

/* The blocked-drop outline hugs the visible jar: ink 10x19 at
   the bottom centre of the 32x48 sprite (left 11, bottom 2). */
.bin.is-dragging.is-blocked::after {
  content: "";
  position: absolute;
  left: calc(12px * var(--scale));
  bottom: calc(0px * var(--scale));
  width: calc(8px * var(--scale));
  height: calc(13px * var(--scale));
  outline: 2px dashed #e05656;
}

/* Add Flower menu: the Add Plant modal's frame with its own
   spacing — no repeat row, so "Customize flower" sits where
   the repeat row would be, and the picker arrows drop to the
   flower row. */
.af-modal .ap-label--choose {
  top: calc(44px * var(--scale));
}

/* The flower name field sits 1 unit up and 4 units right of
   where the plant name field sits in Add Plant. */
.af-modal .ap-input {
  left: calc(var(--stage-w) * 0.2 + 14.8px * var(--scale));
  top: calc(31px * var(--scale));
}

.af-modal .ap-arrow {
  top: calc(84px * var(--scale));
}

/* Flower choices in the picker: one 32x48 jar-and-flower
   sprite per type, centred in the carousel viewport. The
   selected flower lifts, like the plants do. */
.af-flower {
  position: absolute;
  left: calc(72px * var(--scale));
  top: calc(41px * var(--scale));
  width: calc(32px * var(--scale));
  height: calc(62px * var(--scale));
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.af-flower.is-selected {
  transform: translateY(calc(-5px * var(--scale)));
}

.af-flower-sprite {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: auto;
  display: block;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* "How does this method work?" sits next to the Add Flower
   title, in the remove button's small beige style. Clicking
   it plants an "example" flower in an empty bin and starts
   the tutorial inside the bin page. */
.af-howto {
  position: static;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font-family: "Tiny5", monospace;
  font-size: calc(5px * var(--scale));
  line-height: normal;
  color: #bda499;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.af-howto:hover {
  color: #000;
}

/* Bin flower page: full-panel layers (the jar drawing and one
   layer per petal still on the flower), the month/day columns
   on either side, and an invisible button over the jar that
   drops a petal when clicked. Positions follow the bad-habits
   design: the panel sits at 10,10 and the layers on top of it. */
.bh-layer {
  position: absolute;
  left: calc(10.49px * var(--scale));
  top: calc(10px * var(--scale));
  width: calc(236px * var(--scale));
  height: calc(124px * var(--scale));
  /* The click pop grows the drawing from the jar's centre
     (ink centre (118, 70) of the 236x124 layer). */
  transform-origin: 50% 56.5%;
  object-fit: cover;
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  pointer-events: none;
}

/* The drawing was shortened by 7 units (its upper artwork
   moved down 7, the jar's base unmoved), so the petal
   overlays — still drawn for the taller flower — sit 7
   units lower too, keeping them on the flower's head.
   The shortened flower as a whole also sits 2 units lower
   (see the #bh-drawing rule below), so the petals get
   those 2 as well: 10 + 7 + 2 = 19. */
.bh-layer.bh-petal-layer {
  top: calc(19px * var(--scale));
}

/* The shortened drawing sits 2 units lower than the tall
   one (the tall drawing uses the layers' own top, 10). */
.bh-modal:not(.bh-long-drawing) #bh-drawing {
  top: calc(12px * var(--scale));
}

/* Hidden span for measuring a flower name's true width
   (renderBinPage decides which drawing fits). */
.bh-name-measure {
  position: absolute;
  visibility: hidden;
  white-space: nowrap;
}

/* When the name is short enough, the bin page shows the
   TALL drawing instead: the petal overlays sit at the
   layers' own top again and the click pop centres on the
   taller flower (ink centre (118, 67) of the 236x124
   layer). */
.bh-modal.bh-long-drawing .bh-layer {
  transform-origin: 50% 54%;
}

.bh-modal.bh-long-drawing .bh-layer.bh-petal-layer {
  top: calc(10px * var(--scale));
}

/* On the bad-habits page the flower drawing paints ABOVE the
   habit name (the header sits at z-index 2). The layers let
   clicks pass through, so the header's buttons still work. */
.bh-modal .bh-layer {
  z-index: 3;
}

/* Bin page header: the flower name takes its own row, with
   the edit and remove buttons left-aligned just below it
   (the plant page keeps them beside the name). */
.bh-modal .ap-header {
  flex-wrap: wrap;
  row-gap: calc(2px * var(--scale));
}

.bh-modal .ap-title {
  flex: 0 0 100%;
}

.bh-modal .ap-remove {
  margin-top: calc(-3px * var(--scale));
}

.bh-days {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* One month's days in the bin page: a tall column inside a
   short viewport, scrolled to reach the month's end. The
   scrollbar stays invisible; the wheel and touch do the work. */
.bh-col {
  position: absolute;
  width: calc(78px * var(--scale));
  height: calc(81.83px * var(--scale));
  overflow-y: auto;
  overflow-x: hidden;
  pointer-events: auto;
  scrollbar-width: none;
}

.bh-col::-webkit-scrollbar {
  display: none;
}

.bh-col-inner {
  position: relative;
  width: 100%;
}

.bh-t {
  position: absolute;
  margin: 0;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(7px * var(--scale));
  line-height: normal;
  color: #000;
  white-space: nowrap;
}

.bh-petal {
  position: absolute;
  width: calc(16px * var(--scale));
  height: calc(16px * var(--scale));
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  pointer-events: auto;
  cursor: pointer;
  /* The icons' visible petal is only the middle 7x7 of the
     16x16 canvas (ink at 5,4): clip the element to the ink
     so clicks land on the petal itself, not its transparent
     padding — the picture is unchanged. */
  clip-path: inset(25% 25% 31.25% 31.25%);
}

/* The petal popup: a small card (ui-badhabit-popup.png, a
   full-panel canvas whose card ink sits at canvas x 88..155,
   y 31..75) over the bin page, opened by clicking a fallen
   petal. The content sits inside the card: the pick time,
   the notes box, the undo button, a tiny close X. */
.bh-petal-popup {
  position: absolute;
  inset: 0;
  z-index: 6;
}

.bh-petal-popup[hidden] {
  display: none;
}

/* The card and its content, shifted as one group so the
   card lands below the clicked petal. */
.bh-pp-shift {
  position: absolute;
  left: 0;
  top: 0;
}

.bh-popup-card {
  position: absolute;
  left: calc(10.49px * var(--scale));
  top: calc(10px * var(--scale));
  width: calc(236px * var(--scale));
  height: calc(124px * var(--scale));
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  pointer-events: none;
}

/* Above the petal (the flipped case) the card sprite turns
   180 degrees so its arrow nub points down at the petal.
   The turn is around the ink's own centre (canvas 121.5,53
   of 236x124), so the card stays in its box and the text on
   top of it is untouched. */
.bh-petal-popup.is-flipped .bh-popup-card {
  transform: rotate(180deg);
  transform-origin: 51.48% 42.74%;
  /* In the flipped case the sprite alone sits 5 lower;
     the text does not move with it. */
  top: calc(15px * var(--scale));
}

/* The pick time with the undo button right after it, on
   one line. */
.bh-pp-timerow {
  position: absolute;
  left: calc(104.5px * var(--scale));
  top: calc(51px * var(--scale));
  white-space: nowrap;
}

.bh-pp-time {
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(5px * var(--scale));
  line-height: normal;
  color: #000;
}

/* The notes line: the label, then the field 2 units after
   the colon. */
.bh-pp-notesrow {
  position: absolute;
  left: calc(104.5px * var(--scale));
  top: calc(56px * var(--scale));
  white-space: nowrap;
}

.bh-pp-label {
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(5px * var(--scale));
  line-height: normal;
  color: #000;
  /* Pinned to the top of the line: when the note wraps and
     the field grows downward, the label stays where it was
     (baseline alignment would drag it down with the box). */
  vertical-align: top;
}

/* No box: the note is typed on the same line as "notes:",
   right after the colon. */
.bh-pp-notes {
  position: relative;
  top: calc(0.7px * var(--scale));
  vertical-align: top;
  margin-left: calc(2px * var(--scale));
  width: calc(40px * var(--scale));
  height: calc(9px * var(--scale));
  box-sizing: border-box;
  padding: 0;
  font-family: "Tiny5", monospace;
  font-size: calc(4px * var(--scale));
  line-height: normal;
  color: #bda499;
  background: transparent;
  border: 0;
  outline: none;
  resize: none;
  overflow: hidden;
  overflow-wrap: break-word;
}

.bh-pp-notes::placeholder {
  color: #bda499;
  opacity: 1;
}

.bh-pp-undo {
  margin-left: calc(3px * var(--scale));
  padding: 0;
  font-family: "Tiny5", monospace;
  font-size: calc(4px * var(--scale));
  color: #bda499;
  background: none;
  border: 0;
  cursor: pointer;
  vertical-align: baseline;
}

.bh-modal .bh-pp-close {
  position: absolute;
  left: calc(154px * var(--scale));
  top: calc(49.5px * var(--scale));
  width: calc(8px * var(--scale));
  height: calc(8px * var(--scale));
  padding: 0;
  background: url("assets/ui-tiny-x.png") center / contain no-repeat;
  border: 0;
  cursor: pointer;
}

/* Bin tutorial: the bad-habit method, taught inside this
   page in the garden tutorial's own style — the same bobbing
   hint line and the same little arrow. The line sits mainly
   on the right side of the page, its arrow turned to point
   left at the flower. The block starts at x 152: the flower
   drawing's ink ends at x 146, so the text clears it. */
.bh-tut {
  position: absolute;
  right: calc(14px * var(--scale));
  top: calc(26px * var(--scale));
  width: calc(90px * var(--scale));
  z-index: 21;
  display: flex;
  align-items: center;
  gap: calc(3px * var(--scale));
}

.bh-tut[hidden] {
  display: none;
}

.bh-tut-text {
  flex: 1;
  min-width: 0;
}

.bh-hint {
  margin: 0;
  font-family: "Tiny5", monospace;
  font-weight: 400;
  font-size: calc(6px * var(--scale));
  line-height: 1.45;
  color: #000;
  text-align: left;
  animation: hint-bob 2s steps(1) infinite;
}

.bh-hint-arrow {
  flex: none;
  width: calc(9px * var(--scale));
  height: calc(9px * var(--scale));
  transform: rotate(90deg);
  image-rendering: -webkit-crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.bh-hint-arrow[hidden] {
  display: none;
}

/* The petal step: the line moves below the petal popup,
   centred, its arrow on top pointing up at the card. (The
   script can also place it exactly under the card; this low
   spot is the fallback.) */
.bh-tut.is-low {
  left: calc(13px * var(--scale));
  right: auto;
  top: calc(97px * var(--scale));
  width: calc(140px * var(--scale));
  flex-direction: column;
  gap: calc(2px * var(--scale));
}

.bh-tut.is-low .bh-hint-arrow {
  transform: rotate(180deg);
}

.bh-tut.is-low .bh-hint {
  text-align: center;
}

.bh-tut.is-low .bh-tut-create {
  margin-left: auto;
  margin-right: auto;
}

/* The last step's way forward: a small, greyed "create
   plant?" under the closing line. */
.bh-tut-create {
  display: block;
  margin: calc(3px * var(--scale)) 0 0;
  padding: 0;
  font-family: "Tiny5", monospace;
  font-size: calc(5px * var(--scale));
  color: #bda499;
  background: none;
  border: 0;
  cursor: pointer;
  transition: color 0.15s ease;
}

.bh-tut-create:hover {
  color: #000;
}

.bh-tut-create[hidden] {
  display: none;
}

.bh-centre {
  position: absolute;
  left: calc(104px * var(--scale));
  top: calc(20px * var(--scale));
  width: calc(48px * var(--scale));
  height: calc(112px * var(--scale));
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

/* Page arrows for the day columns: the carousel's tiny arrow,
   at the panel's bottom corners, shown only when there is a
   page in that direction (the code hides them otherwise). */
/* Scoped under .bh-modal so this beats the generic
   .ap-container button reset (background: none) — without
   the extra weight the arrows render with no picture. */
.bh-modal .bh-arrow {
  position: absolute;
  top: calc(117px * var(--scale));
  width: calc(11px * var(--scale));
  height: calc(11px * var(--scale));
  background: url("assets/ui-tiny-button-1.png") center / contain no-repeat;
  border: 0;
  padding: 0;
  cursor: pointer;
  z-index: 3;
}

.bh-arrow--prev {
  left: calc(16px * var(--scale));
  transform: scaleX(-1);
}

.bh-arrow--next {
  left: calc(229px * var(--scale));
}`;

// Inject the stylesheet into the page head.
const hgStyleEl = document.createElement('style');
hgStyleEl.textContent = HG_STYLESHEET;
document.head.appendChild(hgStyleEl);

// ---------- 2. Page markup ----------
// Every element of the original page body, built by JavaScript.
// A template string assigned via innerHTML, so every id, class,
// attribute, hidden flag and text matches the original exactly.
const HG_MARKUP = `  <!-- DEV OPTION: Date Setter (Remove anytime - type 'devdate' to show) -->
  <div id="dev-date-container" hidden
    style="display: none; position: fixed; top: 12px; right: 12px; z-index: 9999; background: rgba(0, 0, 0, 0.75); padding: 6px 10px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #fff; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: grab; user-select: none; touch-action: none;">
    <label for="dev-date-input" style="font-size: 11px; opacity: 0.85; user-select: none;">dev date:</label>
    <input id="dev-date-input" type="date"
      style="background: #222; border: 1px solid #555; color: #fff; padding: 2px 6px; border-radius: 4px; font-family: inherit; font-size: 12px; cursor: pointer;">
    <button id="dev-date-reset" type="button" title="Reset to today"
      style="background: #444; border: 0; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; cursor: pointer;">reset</button>
    <button id="dev-date-close" type="button" title="Hide dev date"
      style="background: none; border: 0; color: #aaa; padding: 0 4px; font-size: 14px; line-height: 1; cursor: pointer;">&times;</button>
  </div>
  <!-- /DEV OPTION: Date Setter -->

  <main class="home-screen home-2" aria-label="Habits Garden">
    <img class="shelf" src="assets/shelf-2-1.png" alt="">

    <!-- Plant slots (empty in the design: peace-lily / daisy) -->
    <div class="plant plant--daisy" aria-hidden="true"></div>
    <div class="plant plant--peace-lily" aria-hidden="true"></div>

    <!-- The page starts with a single pot; more are added with the
         add-a-pot button (below) once the intro hint flow is done. -->
    <button class="pot pot--h1 pot--c1 pot--top" type="button" aria-label="Add a plant"></button>

    <p class="hint">click to add a plant!</p>
    <img class="hint-arrow" src="assets/ui-arrow-down.png" alt="">

    <!-- Currency pill (top right): shows today's dew drop count.
         Clicking it opens the dew drops info card. -->
    <button class="ui-currency" id="ui-currency" type="button" aria-label="Dew drops: how they work">
      <img class="ui-currency-img" src="assets/ui-currency.png" alt="">
      <span class="ui-currency-count" id="ui-currency-count">0</span>
    </button>

    <!-- Add-a-pot button: sits below the currency display, hidden
         until the intro hint flow finishes. Each press adds an empty
         pot to the first free shelf slot. -->
    <button class="ui-addplant" id="ui-addplant" type="button" aria-label="Add a pot"></button>

    <!-- Add-a-bin button: below the add-a-pot button, same reveal.
         Each press adds an empty bin (a jar for a bad-habit flower)
         to the first free shelf slot. -->
    <button class="ui-addbin" id="ui-addbin" type="button" aria-label="Add a bin"></button>

    <!-- Account pill: top left of the screen, mirroring the
         currency pill's margins. Unlike the rest of the corner
         UI it is visible from the start. Clicking it opens the
         sign-in page. -->
    <button class="ui-account" id="ui-account" type="button" aria-label="Account">
      <img class="ui-account-img" src="assets/ui-account.png" alt="">
    </button>

    <!-- Sign-in text: sits right of the account pill, inside a
         clipped slot whose left edge is the pill's right edge, so
         the text scrolls out of the pill when it appears (at the
         end of the intro, together with the pills) and scrolls
         back into it once signed in. Clicking it opens the
         sign-in page; while signed in it shows the account. -->
    <div class="ui-signin-slot">
      <button class="ui-signin" id="ui-signin" type="button">already have a garden?</button>
    </div>

    <!-- Drag-to-delete marker: while a pot is dragged, this X floats
         above the spot the drag started from; dropping the pot on it
         deletes the pot. Positioned by the drag code. -->
    <div class="drag-delete-x" id="drag-delete-x" aria-hidden="true"></div>

    <!-- Dew Drops info card: opened by clicking the currency pill.
         Built on the Add Plant modal's panel background. -->
    <div class="dd-modal" id="dew-modal" aria-hidden="true" role="dialog" aria-modal="true"
      aria-labelledby="dd-title">
      <div class="dd-container">
        <img class="dd-panel" src="assets/ui-plant-1.png" alt="">
        <h2 class="dd-title" id="dd-title">Dew Drops</h2>
        <button class="dd-close" id="dd-close" type="button" aria-label="Close"></button>
        <div class="dd-body">
          <p class="dd-line"><img class="dd-bullet" src="assets/drop1-2.png" alt="">Dew drops can be collected from healthy buds and plants at the start of each day.</p>
          <p class="dd-line"><img class="dd-bullet" src="assets/drop1-2.png" alt="">Buds reward 1 drop per day</p>
          <p class="dd-line"><img class="dd-bullet" src="assets/drop1-2.png" alt="">Flowers reward 2 drops per day and a bonus on the day after watering your flower.</p>
          <p class="dd-line"><img class="dd-bullet" src="assets/drop1-2.png" alt="">Dead plants subtract 2 from your dew drops.</p>
          <p class="dd-line"><img class="dd-bullet" src="assets/drop1-2.png" alt="">Dew drops are reset every day</p>
        </div>
      </div>
    </div>

    <!-- Sign In page: opened from the sign-in text under the pills.
         Built on the same panel as the Dew Drops card. Signing in
         ties the garden to the account: while signed in, every
         change is saved and the garden is rebuilt on the next
         visit (see the accounts code further down). -->
    <div class="si-modal" id="signin-modal" aria-hidden="true" role="dialog" aria-modal="true"
      aria-labelledby="si-title">
      <div class="si-container">
        <img class="si-panel" src="assets/ui-plant-1.png" alt="">
        <h2 class="si-title" id="si-title">Sign In</h2>
        <button class="si-close" id="si-close" type="button" aria-label="Close"></button>
        <div class="si-form" id="si-form">
          <button class="si-btn" id="si-google" type="button">sign in with Google</button>
          <p class="si-status" id="si-status"></p>
        </div>
        <div class="si-account" id="si-account" hidden>
          <p class="si-line">signed in as <span id="si-account-email"></span></p>
          <p class="si-line si-line--saved">your plants are saved to your account.</p>
          <button class="si-btn" id="si-signout" type="button">sign out</button>
        </div>
      </div>
    </div>

    <!-- Add Plant Popup Modal -->
    <div class="ap-modal" id="add-plant-modal" aria-hidden="true" role="dialog" aria-modal="true"
      aria-labelledby="ap-title">
      <div class="ap-container">
        <img class="ap-panel" src="assets/ui-plant-1.png" alt="">

        <div class="ap-header">
          <h2 class="ap-title" id="ap-title">Grow your good habits</h2>
          <button class="ap-remove" id="ap-remove" type="button" hidden>remove</button>
          <button class="ap-remove" id="ap-unwater" type="button" hidden>unwater</button>
        </div>
        <button class="ap-close" id="ap-close" type="button" aria-label="Close"></button>

        <!-- Plant name -->
        <label class="ap-label ap-label--name" for="plant-name">Plant Name:</label>
        <input class="ap-input" id="plant-name" type="text" placeholder="go to the gym..." autocomplete="off">

        <!-- Repeat row -->
        <div class="ap-repeat-row">
          <span class="ap-label ap-label--repeat" id="repeat-label">Repeat</span>
          <div class="ap-repeat-control">
            <button class="ap-step ap-step--prev" id="ap-repeat-prev" type="button"
              aria-label="Previous repeat option"></button>
            <span class="ap-repeat-value" id="ap-repeat-val" aria-labelledby="repeat-label">daily</span>
            <button class="ap-step ap-step--next" id="ap-repeat-next" type="button"
              aria-label="Next repeat option"></button>
          </div>
          <!-- Weekly days picker -->
          <div class="ap-days-picker" id="ap-days-picker" aria-label="Choose days of week" hidden>
            <button type="button" class="ap-day-btn is-active" aria-label="Sunday" aria-pressed="true">sun</button>
            <button type="button" class="ap-day-btn is-active" aria-label="Monday" aria-pressed="true">mon</button>
            <button type="button" class="ap-day-btn" aria-label="Tuesday" aria-pressed="false">tue</button>
            <button type="button" class="ap-day-btn" aria-label="Wednesday" aria-pressed="false">wed</button>
            <button type="button" class="ap-day-btn" aria-label="Thursday" aria-pressed="false">thu</button>
            <button type="button" class="ap-day-btn" aria-label="Friday" aria-pressed="false">fri</button>
            <button type="button" class="ap-day-btn" aria-label="Saturday" aria-pressed="false">sat</button>
          </div>
          <!-- Monthly day of month picker -->
          <div class="ap-monthly-picker" id="ap-monthly-picker" aria-label="Choose day of month" hidden>
            <span class="ap-monthly-text">on the</span>
            <input class="ap-day-num-input" id="ap-day-num" type="text" inputmode="numeric" maxlength="2"
              placeholder="__" value="" aria-label="Day of month">
            <span class="ap-ordinal-suffix" id="ap-ordinal-suffix">th</span>
          </div>
          <!-- Yearly date picker -->
          <div class="ap-yearly-picker" id="ap-yearly-picker" aria-label="Choose date of year" hidden>
            <span class="ap-yearly-text">on</span>
            <div class="ap-month-control">
              <button class="ap-step ap-step--prev" id="ap-year-month-prev" type="button"
                aria-label="Previous month"></button>
              <span class="ap-month-value" id="ap-year-month-val">Jan</span>
              <button class="ap-step ap-step--next" id="ap-year-month-next" type="button"
                aria-label="Next month"></button>
            </div>
            <input class="ap-day-num-input" id="ap-year-day-num" type="text" inputmode="numeric" maxlength="2"
              placeholder="__" value="" aria-label="Day of month">
            <span class="ap-ordinal-suffix" id="ap-year-ordinal-suffix">th</span>
          </div>
        </div>

        <!-- Customize plant -->
        <p class="ap-label ap-label--choose">Customize plant</p>
        <button class="ap-arrow ap-arrow--prev" id="ap-plant-prev" type="button" aria-label="Previous plants"></button>
        <div class="ap-carousel-viewport">
          <div class="ap-carousel-track" id="ap-carousel-track">
            <button class="ap-plant ap-plant--cactus" type="button" aria-label="Cactus" data-plant="cactus">
              <img class="ap-plant-sprite" src="assets/cactus-1.png" alt="">
              <img class="ap-plant-pot" src="assets/pot-template.png" alt="">
            </button>
            <button class="ap-plant ap-plant--droopy" type="button" aria-label="White droopy flower" data-plant="droopy">
              <img class="ap-plant-sprite" src="assets/white-droopy-flower.png" alt="">
              <img class="ap-plant-pot" src="assets/pot-template.png" alt="">
            </button>
            <button class="ap-plant ap-plant--tree" type="button" aria-label="White flowered tree" data-plant="tree">
              <img class="ap-plant-sprite" src="assets/white-flowered-tree-2.png" alt="">
              <img class="ap-plant-pot" src="assets/pot-template.png" alt="">
            </button>
            <button class="ap-plant ap-plant--lily" type="button" aria-label="Peace lily" data-plant="lily">
              <img class="ap-plant-sprite" src="assets/peace-lily-3-2.png" alt="">
              <img class="ap-plant-pot" src="assets/pot-template.png" alt="">
            </button>
            <button class="ap-plant ap-plant--daisy" type="button" aria-label="Daisy" data-plant="daisy">
              <img class="ap-plant-sprite" src="assets/daisy-2-1.png" alt="">
              <img class="ap-plant-pot" src="assets/pot-template.png" alt="">
            </button>
            <button class="ap-plant ap-plant--lavender" type="button" aria-label="Lavender" data-plant="lavender">
              <img class="ap-plant-sprite" src="assets/lavender-3.png" alt="">
              <img class="ap-plant-pot" src="assets/pot-template.png" alt="">
            </button>
          </div>
        </div>
        <button class="ap-arrow ap-arrow--next" id="ap-plant-next" type="button" aria-label="Next plants"></button>

        <!-- Mini steppers for pot style (Add Plant 3) -->
        <button class="ap-mini ap-mini--prev" id="ap-pot-prev" type="button" aria-label="Previous pot style"></button>
        <button class="ap-mini ap-mini--next" id="ap-pot-next" type="button" aria-label="Next pot style"></button>

        <!-- Commit button -->
        <button class="ap-commit" id="ap-commit" type="button" disabled>COMMIT</button>
      </div>
    </div>

    <!-- Plant Details Popup Modal -->
    <div class="pd-modal" id="plant-details-modal" aria-hidden="true" role="dialog" aria-modal="true"
      aria-labelledby="pd-title">
      <div class="pd-dialog" id="pd-dialog">
        <img class="pd-bg" id="pd-bg" src="assets/ui-popup-left.png" alt="">
        <div class="pd-content" id="pd-content">
          <img class="pd-bar" src="assets/ui-streak-bar.png" alt="">

          <h2 class="pd-title" id="pd-title">Plant Name</h2>
          <p class="pd-repeat" id="pd-repeat">Repeat</p>

          <p class="pd-today">today</p>
          <ul class="pd-streak" id="pd-streak">
            <!-- 8 days rendered dynamically -->
          </ul>

          <button class="pd-unwater" id="pd-unwater" type="button">unwater</button>
          <button class="pd-water" id="pd-water" type="button" aria-label="Water plant"></button>
          <div class="pd-actions"><button class="pd-edit" id="pd-edit" type="button">edit</button>&nbsp;&nbsp;<button
              class="pd-remove" id="pd-remove" type="button">remove</button></div>
        </div>
      </div>
    </div>

    <!-- Add Flower Popup Modal (for bins): mirrors the Add Plant
         modal — a name field and a scrolling flower picker. No
         flower artwork exists yet, so the picker offers the
         placeholder flower only. -->
    <div class="ap-modal af-modal" id="add-flower-modal" aria-hidden="true" role="dialog" aria-modal="true"
      aria-labelledby="af-title">
      <div class="ap-container">
        <img class="ap-panel" src="assets/ui-plant-1.png" alt="">

        <div class="ap-header">
          <h2 class="ap-title" id="af-title">Fix bad habits</h2>
          <button class="af-howto" id="af-howto" type="button">How does this method work?</button>
          <button class="ap-remove" id="af-remove" type="button" hidden>remove</button>
        </div>
        <button class="ap-close" id="af-close" type="button" aria-label="Close"></button>

        <!-- Flower name -->
        <label class="ap-label ap-label--name" for="flower-name">Flower name:</label>
        <input class="ap-input" id="flower-name" type="text" placeholder="check my phone less..." autocomplete="off">

        <!-- Customize flower -->
        <p class="ap-label ap-label--choose">Customize flower</p>
        <button class="ap-arrow ap-arrow--prev" id="af-flower-prev" type="button"
          aria-label="Previous flowers"></button>
        <div class="ap-carousel-viewport">
          <div class="ap-carousel-track" id="af-carousel-track">
            <button class="af-flower" type="button" aria-label="Placeholder flower"
              data-flower="placeholder">
              <img class="af-flower-sprite" src="assets/bin-yellow-flower.png" alt="">
            </button>
          </div>
        </div>
        <button class="ap-arrow ap-arrow--next" id="af-flower-next" type="button"
          aria-label="Next flowers"></button>

        <!-- Commit button -->
        <button class="ap-commit" id="af-commit" type="button" disabled>COMMIT</button>
      </div>
    </div>

    <!-- Bin Flower Page: opened by clicking a bin that has a
         flower. The flower stands in its jar in the middle; the
         days from the flower's creation to today run down the
         columns on either side (a new month always starts a new
         column, two columns to a page, tiny arrows switch pages),
         and every petal the flower has lost sits next to the date
         it fell on. Clicking the flower drops another petal. -->
    <div class="ap-modal bh-modal" id="bin-page-modal" aria-hidden="true" role="dialog" aria-modal="true"
      aria-labelledby="bh-name">
      <div class="ap-container">
        <img class="ap-panel" src="assets/ui-plant-1.png" alt="">
        <img class="bh-layer" id="bh-drawing" src="assets/bin-flower-drawing.png" alt="">
        <img class="bh-layer bh-petal-layer" id="bh-petal-1" data-petal="1" src="assets/petal1.png" alt="">
        <img class="bh-layer bh-petal-layer" id="bh-petal-2" data-petal="2" src="assets/petal2.png" alt="">
        <img class="bh-layer bh-petal-layer" id="bh-petal-3" data-petal="3" src="assets/petal3.png" alt="">
        <img class="bh-layer bh-petal-layer" id="bh-petal-4" data-petal="4" src="assets/petal4.png" alt="">
        <img class="bh-layer bh-petal-layer" id="bh-petal-5" data-petal="5" src="assets/petal5.png" alt="">
        <img class="bh-layer bh-petal-layer" id="bh-petal-6" data-petal="6" src="assets/petal6.png" alt="">
        <div class="bh-days" id="bh-days"></div>
        <button class="bh-centre" id="bh-centre" type="button" aria-label="Drop a petal"></button>
        <div class="ap-header">
          <h2 class="ap-title" id="bh-name">Flower Name</h2>
          <button class="ap-remove" id="bh-edit" type="button">edit</button>
          <button class="ap-remove" id="bh-remove" type="button">remove</button>
        </div>
        <button class="ap-close" id="bh-close" type="button" aria-label="Close"></button>
        <button class="bh-arrow bh-arrow--prev" id="bh-page-prev" type="button"
          aria-label="Previous page"></button>
        <button class="bh-arrow bh-arrow--next" id="bh-page-next" type="button" aria-label="Next page"></button>
        <!-- Clicking a fallen petal opens this card: when the
             petal was picked, a notes box, and an undo button. -->
        <div class="bh-petal-popup" id="bh-petal-popup" hidden>
          <div class="bh-pp-shift" id="bh-pp-shift">
            <img class="bh-popup-card" src="assets/ui-badhabit-popup.png" alt="">
            <div class="bh-pp-timerow"><span class="bh-pp-time" id="bh-pp-time"></span><button class="bh-pp-undo" id="bh-pp-undo" type="button">undo</button></div>
            <div class="bh-pp-notesrow"><label class="bh-pp-label" for="bh-pp-notes">notes:</label><textarea class="bh-pp-notes" id="bh-pp-notes" placeholder="type here..." rows="1"></textarea></div>
            <button class="bh-pp-close" id="bh-pp-close" type="button" aria-label="Close"></button>
          </div>
        </div>
        <!-- The bin tutorial lives here, in the garden
             tutorial's style: a bobbing hint line and the
             little down arrow over the top of the panel. -->
        <div class="bh-tut" id="bh-tut" hidden>
          <img class="bh-hint-arrow" id="bh-hint-arrow" src="assets/ui-arrow-down.png" alt="">
          <div class="bh-tut-text">
            <p class="bh-hint" id="bh-hint"></p>
            <button class="bh-tut-create" id="bh-tut-create" type="button" hidden>create plant?</button>
          </div>
        </div>
      </div>
    </div>
  </main>

  `;

document.body.innerHTML = HG_MARKUP;

// ---------- 3. Game logic ----------
// The original inline game script, carried over unchanged (including
// the DEV date helper at its top). It runs here, after the markup
// above exists, preserving the original load order.

// DEV OPTION: Date Setter helper (Remove anytime)
    function getCurrentDate() {
      if (window.__DEV_DATE__) {
        return new Date(window.__DEV_DATE__);
      }
      return new Date();
    }
    // /DEV OPTION

    // ---- Game day: every day starts at 4am ----
    // Before 4am it is still yesterday's game day: 2am on the 12th
    // counts as the 11th. Everything date-based — watering days,
    // missed days and plant death, dew drop rewards — follows this
    // game day, never the calendar day. getGameDate() returns the
    // current moment shifted back a day when it falls before 4am,
    // so its calendar date IS the game date. (A plain formatter like
    // getLocalDateStr must NOT shift: opportunity dates built at
    // midnight would slide a day. Only "now" gets shifted.)
    const DAY_START_HOUR = 4;
    function getGameDate(date = getCurrentDate()) {
      const d = new Date(date);
      if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1);
      return d;
    }
    // The game day as a toDateString() ("Tue Nov 11 2026") — the
    // format lastWateredDate is stored and compared in.
    function getGameDayStr() {
      return getGameDate().toDateString();
    }

    // ---- Fit the garden to the screen ----
    // The stage is 256x144 design units and everything on it is
    // sized from the single --scale variable. Set that scale from
    // the real window size — the smaller of (window width / 256)
    // and (window height / 144) — so the whole garden always fits
    // on one screen at any window size, in fullscreen too, with
    // nothing to scroll (the body also hides overflow, see
    // styles.css). Runs at load and again whenever the window is
    // resized or the visible viewport changes (browser zoom, device
    // toolbars). On a screen that is not exactly 16:9 the stage
    // centres with the page background showing at the sides or the
    // top/bottom — stretching it to fill both axes would distort
    // the pixel art, since everything scales from one --scale.
    function fitStage() {
      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      if (!vw || !vh) return;
      const scale = Math.min(vw / 256, vh / 144);
      document.documentElement.style.setProperty('--scale', String(scale));
    }
    fitStage();
    window.addEventListener('resize', fitStage);
    window.addEventListener('orientationchange', fitStage);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitStage);
    }

    const modal = document.getElementById('add-plant-modal');
    const closeBtn = document.getElementById('ap-close');
    const apTitle = document.getElementById('ap-title');
    const apRemove = document.getElementById('ap-remove');
    const apUnwater = document.getElementById('ap-unwater');
    const plantInput = document.getElementById('plant-name');
    const commitBtn = document.getElementById('ap-commit');
    // A plain array (not the live NodeList) so the add-a-pot button
    // can push new pots into every loop below at runtime.
    const pots = Array.from(document.querySelectorAll('.pot'));
    // Bins (bad-habit flower jars) share the shelf with the pots;
    // the bins code lives further down, past the garden saving.
    const bins = [];
    const repeatVal = document.getElementById('ap-repeat-val');
    const daysPicker = document.getElementById('ap-days-picker');
    const monthlyPicker = document.getElementById('ap-monthly-picker');
    const dayNumInput = document.getElementById('ap-day-num');
    const ordinalSuffix = document.getElementById('ap-ordinal-suffix');
    const yearlyPicker = document.getElementById('ap-yearly-picker');
    const yearMonthPrev = document.getElementById('ap-year-month-prev');
    const yearMonthNext = document.getElementById('ap-year-month-next');
    const yearMonthVal = document.getElementById('ap-year-month-val');
    const yearDayNumInput = document.getElementById('ap-year-day-num');
    const yearOrdinalSuffix = document.getElementById('ap-year-ordinal-suffix');
    const dayBtns = document.querySelectorAll('.ap-day-btn');
    const plantBtns = document.querySelectorAll('.ap-plant');

    // Plant details modal elements
    const pdModal = document.getElementById('plant-details-modal');
    const pdDialog = document.getElementById('pd-dialog');
    const pdBg = document.getElementById('pd-bg');
    const pdContent = document.getElementById('pd-content');
    const pdTitle = document.getElementById('pd-title');
    const pdRepeat = document.getElementById('pd-repeat');
    const pdStreak = document.getElementById('pd-streak');
    const pdWater = document.getElementById('pd-water');
    const pdUnwater = document.getElementById('pd-unwater');
    const pdEdit = document.getElementById('pd-edit');
    const pdRemove = document.getElementById('pd-remove');

    // Manual scrolling for a too-long name: drag it sideways,
    // or use the wheel over it. Used by the plant popup's name
    // (which used to scroll itself back and forth on its own)
    // and by the bin page's name continuation.
    function wireManualScroll(el) {
      if (!el) return;
      let drag = null;
      el.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, scroll: el.scrollLeft || 0 };
        el.classList.add('is-dragging');
      });
      el.addEventListener('pointermove', (e) => {
        if (!drag) return;
        el.scrollLeft = drag.scroll - (e.clientX - drag.x);
      });
      const endDrag = () => { drag = null; el.classList.remove('is-dragging'); };
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
      el.addEventListener('wheel', (e) => {
        if (el.scrollWidth <= el.clientWidth) return;
        e.preventDefault();
        el.scrollLeft += (e.deltaY || 0) + (e.deltaX || 0);
      }, { passive: false });
    }
    wireManualScroll(pdTitle);

    const potOptions = [
      { id: 'clay', name: 'Clay pot', src: 'assets/pot-template.png', isWhite: false, isShort: false },
      { id: 'orange', name: 'Orange pot', src: 'assets/pot-orange.png', isWhite: false, isShort: true },
      { id: 'white', name: 'White pot', src: 'assets/pot-white.png', isWhite: true, isShort: true },
      { id: 'blue', name: 'Blue pot', src: 'assets/pot-blue.png', isWhite: false, isShort: true },
      { id: 'yellow', name: 'Yellow pot', src: 'assets/pot-yellow.png', isWhite: false, isShort: true },
      { id: 'grey', name: 'Grey pot', src: 'assets/pot-grey.png', isWhite: false, isShort: true },
      { id: 'orange-smaller', name: 'Smaller orange pot', src: 'assets/pot-smaller-orange.png', isWhite: false, isShort: true, isSmaller: true },
      { id: 'white-smaller', name: 'Smaller white pot', src: 'assets/pot-smaller-white.png', isWhite: true, isShort: true, isSmaller: true },
      { id: 'blue-smaller', name: 'Smaller blue pot', src: 'assets/pot-smaller-blue.png', isWhite: false, isShort: true, isSmaller: true },
      { id: 'yellow-smaller', name: 'Smaller yellow pot', src: 'assets/pot-smaller-yellow.png', isWhite: false, isShort: true, isSmaller: true },
      { id: 'grey-smaller', name: 'Smaller grey pot', src: 'assets/pot-smaller-grey.png', isWhite: false, isShort: true, isSmaller: true },
      { id: 'orange-smallest', name: 'Smallest orange pot', src: 'assets/pot-smallest-orange.png', isWhite: false, isShort: true, isSmall: true },
      { id: 'white-smallest', name: 'Smallest white pot', src: 'assets/pot-smallest-white.png', isWhite: true, isShort: true, isSmall: true },
      { id: 'blue-smallest', name: 'Smallest blue pot', src: 'assets/pot-smallest-blue.png', isWhite: false, isShort: true, isSmall: true },
      { id: 'yellow-smallest', name: 'Smallest yellow pot', src: 'assets/pot-smallest-yellow.png', isWhite: false, isShort: true, isSmall: true },
      { id: 'grey-smallest', name: 'Smallest grey pot', src: 'assets/pot-smallest-grey.png', isWhite: false, isShort: true, isSmall: true },
    ];
    let selectedPotIndex = 0; // clay pot by default

    function setSelectedPot(index) {
      if (index < 0 || index >= potOptions.length) return;
      selectedPotIndex = index;
      const potData = potOptions[selectedPotIndex];

      // Update the pots on all plant options in the carousel
      const carouselPots = document.querySelectorAll('.ap-plant-pot');
      carouselPots.forEach(p => {
        p.src = potData.src;
      });
      const carouselTrack = document.getElementById('ap-carousel-track');
      if (carouselTrack) {
        carouselTrack.classList.toggle('is-white-pot', potData.isWhite);
        carouselTrack.classList.toggle('is-short-pot', !!potData.isShort);
        carouselTrack.classList.toggle('is-small-pot', !!potData.isSmall);
        carouselTrack.classList.toggle('is-smaller-pot', !!potData.isSmaller);
      }
    }

    const potPrevBtn = document.getElementById('ap-pot-prev');
    const potNextBtn = document.getElementById('ap-pot-next');
    potPrevBtn?.addEventListener('click', () => {
      const prevIdx = (selectedPotIndex - 1 + potOptions.length) % potOptions.length;
      setSelectedPot(prevIdx);
    });
    potNextBtn?.addEventListener('click', () => {
      const nextIdx = (selectedPotIndex + 1) % potOptions.length;
      setSelectedPot(nextIdx);
    });

    // ---------- Drag-and-drop pots (free position on the shelf) ----------
    // Shelf slots in design units (1 unit = 1px before --scale).
    // Columns match the --col-1..4 positions; rows match --row-top/bottom.
    // Pots start on the 8 slots, but dragging can put a pot at any
    // continuous horizontal position on a shelf row (like the space):
    // vertical position always snaps to the nearest shelf row.
    const stageEl = document.querySelector('.home-screen');
    const SLOT_COL_LEFT = [67, 96.94, 127.17, 157];
    const SLOT_ROW_TOP = { top: 21, bottom: 81 };
    const POT_SIZE = 32;
    const POT_MIN_LEFT = 37; // shelf's left edge in design units
    const POT_MAX_LEFT = 183; // shelf's right edge minus the pot width
    // Visible sprite bounds per pot type, measured from the PNGs:
    // ink width, and the height the sprite occupies at the bottom of
    // the 32-unit pot button. clay 16x13, white/blue/yellow/orange/grey
    // 12x11, orange-smaller/white-smaller/blue-smaller/yellow-smaller/
    // grey-smaller 10x9, the smallest pots (orange/white/blue/yellow/
    // grey) 8x7. The overlap detection zone is the sprite shrunk by 1
    // unit on each side (detection widths 14/10/8/6), so two pots block
    // each other when their left edges are closer than the average of
    // their detection widths: clay-clay 14, clay-mid 12, clay-smaller
    // 11, mid-mid 10, mid-smaller 9, smaller-smaller 8, clay-small
    // 10, mid-small 8, smaller-small 7, small-small 6.
    // Pointer hit zones are a separate thing (see the hit-test
    // helpers below): dragging uses the pot's full sprite,
    // clicking uses the pot sprite plus the plant's artwork, and
    // collecting dew uses that same pot+plant zone and always
    // takes precedence over the other two.
    const POT_SPRITE = {
      clay: { w: 16, h: 13 },
      white: { w: 12, h: 11 }, blue: { w: 12, h: 11 }, yellow: { w: 12, h: 11 },
      orange: { w: 12, h: 11 }, grey: { w: 12, h: 11 },
      'orange-smaller': { w: 10, h: 9 }, 'white-smaller': { w: 10, h: 9 },
      'blue-smaller': { w: 10, h: 9 }, 'yellow-smaller': { w: 10, h: 9 },
      'grey-smaller': { w: 10, h: 9 },
      'orange-smallest': { w: 8, h: 7 }, 'white-smallest': { w: 8, h: 7 },
      'blue-smallest': { w: 8, h: 7 }, 'yellow-smallest': { w: 8, h: 7 },
      'grey-smallest': { w: 8, h: 7 },
    };
    function getPotSprite(pot) {
      const type = (pot && pot.dataset.potType) || 'clay';
      return POT_SPRITE[type] ?? POT_SPRITE.clay;
    }
    function getPotDetectWidth(pot) {
      return getPotSprite(pot).w - 2;
    }

    // ---- Pointer hit zones ----
    // Three zones, one per action:
    // - dragging: the pot's own sprite, at its full size;
    // - clicking: the pot's sprite plus the plant's artwork, so a
    //   click on the leaves counts as a click on that plant;
    // - collecting dew: the same pot+plant zone, and it always
    //   wins — a press or click landing on a plant with drops
    //   waiting collects them instead of dragging or opening
    //   anything (see wirePotDrag / wirePotClick).
    // Without zones at all, a press on the empty part of a pot's
    // 32-unit button box — or, now that pots can sit close
    // together, on a neighbour's sprite — would hit the wrong
    // pot. Zones are tested in each pot's own box coordinates,
    // topmost pot first (later in the DOM paints above earlier
    // pots). The drop-overlap detection above is separate and
    // keeps its shrunk widths.

    // A pointer position in a pot's own 32-unit box coordinates,
    // or null when the pot has no size (not laid out).
    function potBoxPoint(pot, clientX, clientY) {
      const rect = pot.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const scale = rect.width / POT_SIZE;
      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
      };
    }

    // The pot sprite's full ink box: bottom-centred in the
    // 32-unit box, exactly the visible sprite (no shrink).
    function potInkBox(pot) {
      const s = getPotSprite(pot);
      return { left: (POT_SIZE - s.w) / 2, top: POT_SIZE - s.h, w: s.w, h: s.h };
    }

    // The plant artwork's ink box in the same coordinates, or
    // null when the pot is empty. The plant image sits on the
    // pot's rim (its bottom is the sprite height) and renders at
    // the pot size's scale; the ink starts at ink.left inside the
    // image, and the image itself is offset by the .pot-plant
    // CSS left for the pot's size, plus the bud / peace-lily
    // centring nudges (which scale with the plant).
    function plantInkBox(pot) {
      if (!pot.classList.contains('has-plant')) return null;
      const src = plantSpriteSrc(pot);
      const ink = plantInkSize(pot);
      const pScale = plantRenderScale(pot);
      const seat = getPotSprite(pot).h;
      let imgLeft = pScale === 0.5 ? 8 : pScale === 0.75 ? 4 : 0;
      if (src.includes('bud')) imgLeft += 0.5 * pScale;
      if (src.includes('peace-lily')) imgLeft -= 1 * pScale;
      return {
        left: imgLeft + ink.left * pScale,
        top: POT_SIZE - seat - ink.h * pScale,
        w: ink.w * pScale,
        h: ink.h * pScale,
      };
    }

    function inBox(box, x, y) {
      return !!box && x >= box.left && x <= box.left + box.w && y >= box.top && y <= box.top + box.h;
    }

    // Dragging starts on the pot itself: its full visible sprite.
    function isInDragZone(pot, clientX, clientY) {
      const p = potBoxPoint(pot, clientX, clientY);
      return !!p && inBox(potInkBox(pot), p.x, p.y);
    }

    // Clicking and collecting work on the pot or the plant.
    function isInPlantZone(pot, clientX, clientY) {
      const p = potBoxPoint(pot, clientX, clientY);
      if (!p) return false;
      return inBox(potInkBox(pot), p.x, p.y) || inBox(plantInkBox(pot), p.x, p.y);
    }

    // The topmost pot whose given zone contains the pointer, or
    // null when the point is in no pot's zone.
    function potAtPoint(clientX, clientY, zoneFn) {
      for (let i = pots.length - 1; i >= 0; i--) {
        if (zoneFn(pots[i], clientX, clientY)) return pots[i];
      }
      return null;
    }

    // Does this plant have dew drops waiting to be collected?
    function potHasDew(pot) {
      return pot.classList.contains('has-plant')
        && !!pot.dataset.dewToday
        && pot.dataset.dewCollected !== 'true';
    }

    // The topmost plant with drops waiting whose pot+plant zone
    // contains the pointer. Collecting takes precedence over
    // every other action on that press.
    function dewPotAtPoint(clientX, clientY) {
      for (let i = pots.length - 1; i >= 0; i--) {
        if (potHasDew(pots[i]) && isInPlantZone(pots[i], clientX, clientY)) return pots[i];
      }
      return null;
    }

    // Set when a pointer press collects dew: the click the same
    // press produces must not then open the plant's popup.
    // wirePotClick checks and clears it, and any new press clears
    // it too, so it can only ever eat its own press's click.
    let dewSwallowPot = null;

    // Paint order by pot size, then by last drag within a size: the
    // smallest pot goes on top, so a tiny pot tucked against a big one
    // stays visible instead of being swallowed by it; among pots of the
    // same size, the last dragged one goes in front (a drag counts even
    // if the pot ends up back where it started). Tiers follow the
    // measured sprite width, so they still hold if the sprites are
    // resized: the smallest pots (8) front, the smaller pots (10) next,
    // white/blue/yellow/orange/grey (12) middle, clay (16, and empty
    // pots) back. Called when a pot is planted (its
    // type changes) and after a drag (to restore the tier after the
    // dragging pot was lifted to z-index 50).
    const lastDraggedByTier = { small: null, narrow: null, mid: null, clay: null };
    function getPotTier(pot) {
      const w = getPotSprite(pot).w;
      return w <= 8 ? 'small' : w <= 10 ? 'narrow' : w <= 12 ? 'mid' : 'clay';
    }
    function updatePotZOrder(pot) {
      const tier = getPotTier(pot);
      const isFront = lastDraggedByTier[tier] === pot;
      if (tier === 'small') pot.style.zIndex = isFront ? 11 : 10;
      else if (tier === 'narrow') pot.style.zIndex = isFront ? 9 : 8;
      else if (tier === 'mid') pot.style.zIndex = isFront ? 6 : 5;
      else pot.style.zIndex = isFront ? 1 : '';
    }
    function notePotDragged(pot) {
      const tier = getPotTier(pot);
      const prev = lastDraggedByTier[tier];
      lastDraggedByTier[tier] = pot;
      if (prev && prev !== pot) updatePotZOrder(prev);
    }
    const ROW_MID_Y = 67; // pot centre above this -> top shelf, else bottom

    // The pot's starting slot, from its pot--cN/pot--hN + row classes.
    function getPotSlot(pot) {
      let col = 1;
      if (pot.classList.contains('pot--c2') || pot.classList.contains('pot--h2')) col = 2;
      else if (pot.classList.contains('pot--c3') || pot.classList.contains('pot--h3')) col = 3;
      else if (pot.classList.contains('pot--c4') || pot.classList.contains('pot--h4')) col = 4;
      const row = pot.classList.contains('pot--bottom') ? 'bottom' : 'top';
      return { col, row };
    }

    // Live position: { left, row }. Left is the last free position
    // (dataset.posLeft, in design units); before any move it is the
    // starting slot's left. Row comes from the pot--top/pot--bottom class.
    function getPotPos(pot) {
      const row = pot.classList.contains('pot--bottom') ? 'bottom' : 'top';
      if (pot.dataset.posLeft !== undefined && pot.dataset.posLeft !== '') {
        return { left: parseFloat(pot.dataset.posLeft), row };
      }
      const slot = getPotSlot(pot);
      return { left: SLOT_COL_LEFT[slot.col - 1], row: slot.row };
    }

    function setPotPos(pot, left, row) {
      pot.dataset.posLeft = String(left);
      pot.style.left = `calc(${left}px * var(--scale))`;
      for (let i = 1; i <= 4; i++) {
        pot.classList.remove(`pot--c${i}`, `pot--h${i}`);
      }
      pot.classList.remove('pot--top', 'pot--bottom');
      pot.classList.add(`pot--${row}`);
      // Every move (drag, arrow keys, reset, add-a-pot) goes through
      // here, so this is the one place that keeps a signed-in
      // account's saved garden up to date on positions.
      saveGarden();
    }

    // Each pot's home slot, recorded once at load from its initial
    // classes. Dragging never rewrites it, so "reset position" always
    // means the original slot.
    pots.forEach(pot => {
      const slot = getPotSlot(pot);
      pot.dataset.homeLeft = String(SLOT_COL_LEFT[slot.col - 1]);
      pot.dataset.homeRow = slot.row;
    });

    // Is a left-edge position on a row free for exceptPot? Another pot
    // on the same row blocks it when their detection zones overlap —
    // i.e. their left edges are closer than the average of their
    // detection widths (see POT_SPRITE). Empty pots count as clay.
    function posIsFree(left, row, exceptPot) {
      const w = getPotDetectWidth(exceptPot);
      for (const p of pots) {
        if (p === exceptPot) continue;
        const s = getPotPos(p);
        if (s.row === row && Math.abs(s.left - left) < (w + getPotDetectWidth(p)) / 2) return false;
      }
      // Bins block pots too (a bin's detection width is 8).
      for (const b of bins) {
        if (b.dataset.binRow === row && Math.abs(Number(b.dataset.binLeft) - left) < (w + 6) / 2) return false;
      }
      return true;
    }

    // Resolve a drop: the drop point if free, else the nearest free spot
    // on the same row (scanning outward 1 unit at a time, left first),
    // else null (row full — the pot snaps back to the drag origin).
    function resolveDrop(left, row, exceptPot) {
      const lo = Math.max(POT_MIN_LEFT, Math.min(POT_MAX_LEFT, Math.round(left)));
      if (posIsFree(lo, row, exceptPot)) return { left: lo, row };
      for (let d = 1; d <= POT_MAX_LEFT - POT_MIN_LEFT; d++) {
        if (lo - d >= POT_MIN_LEFT && posIsFree(lo - d, row, exceptPot)) return { left: lo - d, row };
        if (lo + d <= POT_MAX_LEFT && posIsFree(lo + d, row, exceptPot)) return { left: lo + d, row };
      }
      return null;
    }

    // ---------- Intro hint flow ----------
    // The hint stays at one fixed spot (pointing at the top-left pot)
    // and never follows a pot. It starts as "click to add a plant!".
    // After the first plant is planted it becomes "water your plant to
    // track your progress!" — and it stays there until the first
    // watering, no matter how much you move pots around. After the
    // first watering it becomes "drag to move!", and only a move made
    // after that prompt makes the hint and arrow go away for good
    // (for the session). A move before anything is planted doesn't
    // count either.
    // Finishing the intro is remembered: a "tutorial finished"
    // flag is kept in the browser, but the flag only counts for
    // a signed-in account — signed-out visits always get the
    // tutorial. So the three flags below start finished only
    // when the flag is set AND this TAB has an account on
    // record (the hg.cloudEmail.v1 key, kept per tab; its
    // const lives with the sign-in code below), and the
    // sign-in hook applies the flag for real once a sign-in
    // is confirmed.
    // (lsGet/ssGet are defined with the accounts code; they
    // are hoisted and safe to call here.)
    const tutorialFinished = !!lsGet('hg.tutorialDone.v1') && !!ssGet('hg.cloudEmail.v1');
    let hasPlantedFirstPlant = tutorialFinished;
    let hasWateredFirstPlant = tutorialFinished;
    let hasMovedFirstPot = tutorialFinished;

    function updateHint() {
      const hint = document.querySelector('.hint');
      const hintArrow = document.querySelector('.hint-arrow');
      if (hasMovedFirstPot) {
        // Remember the finished tutorial for future visits.
        lsSet('hg.tutorialDone.v1', true);
        if (hint) hint.remove();
        if (hintArrow) hintArrow.remove();
        // The intro is finished: reveal the corner stack — the
        // currency pill, the add-a-pot button and the sign-in text
        // all appear together.
        const addPotBtn = document.getElementById('ui-addplant');
        if (addPotBtn) addPotBtn.classList.add('is-visible');
        const addBinBtn = document.getElementById('ui-addbin');
        if (addBinBtn) addBinBtn.classList.add('is-visible');
        const currencyBtn = document.getElementById('ui-currency');
        if (currencyBtn) currencyBtn.classList.add('is-visible');
        const signInText = document.getElementById('ui-signin');
        if (signInText) signInText.classList.add('is-visible');
        // The accounts section has a second signed-out
        // message for this moment ("sign in to save your
        // plants"); it decides whether it applies.
        if (window.hgOnTutorialDone) window.hgOnTutorialDone();
        return;
      }
      if (hasWateredFirstPlant && hint) {
        hint.textContent = 'drag to move!';
      } else if (hasPlantedFirstPlant && hint) {
        hint.textContent = 'water your plant to track your progress!';
      }
      positionHint();
    }

    // A returning user who finished the tutorial on an earlier
    // visit: apply it right away — no hint, and the corner UI is
    // revealed from the start.
    if (hasMovedFirstPot) updateHint();

    // Keep the hint text centred on the arrow. The hint itself never
    // moves: it stays at its fixed spot (CSS top 23, arrow top 29,
    // pointing at the top-left pot) and no longer follows any pot.
    // This only re-centres the text when the wording changes, since
    // the prompts are different lengths.
    function positionHint() {
      const hint = document.querySelector('.hint');
      if (!hint) return;
      const centreX = 83.68; // centre of the arrow as placed by CSS
      // Centre the text on the arrow: measure its rendered width and
      // convert back to design units, so calc() keeps it right if the
      // stage rescales. (No translateX: the bob animation owns transform.)
      const stageWidth = stageEl.getBoundingClientRect().width;
      if (stageWidth > 0 && hint.offsetWidth > 0) {
        const textWidthDesign = hint.offsetWidth / (stageWidth / 256);
        hint.style.left = `calc(${centreX - textWidthDesign / 2}px * var(--scale))`;
      }
    }

    function noteFirstWatered() {
      if (hasWateredFirstPlant) return;
      hasWateredFirstPlant = true;
      updateHint();
    }

    function noteFirstPotMoved() {
      if (hasMovedFirstPot) return;
      // A move only dismisses the hint once the "drag to move!"
      // prompt is showing (after the first watering). The water tip
      // only goes away when you water, so moves before that leave it
      // alone; a move before anything is planted doesn't count either.
      if (!hasPlantedFirstPlant || !hasWateredFirstPlant) return;
      hasMovedFirstPot = true;
      updateHint();
    }

    // ---------- Add-a-pot button ----------
    // Revealed by updateHint once the intro flow is finished (above).
    // Each press adds one empty pot at the first free shelf slot —
    // the designed slots in order (top row left to right, then the
    // bottom row). If every slot happens to be blocked by dragged
    // pots, the nearest free spot to the first slot is used instead;
    // if a shelf is completely full, nothing happens. The new pot's
    // home is where it appears, so "reset position" returns it there.
    function addPot() {
      const pot = document.createElement('button');
      pot.classList.add('pot');
      pot.setAttribute('type', 'button');
      pot.setAttribute('aria-label', 'Add a plant');
      let spot = null;
      for (const row of ['top', 'bottom']) {
        for (const left of SLOT_COL_LEFT) {
          if (posIsFree(left, row, pot)) { spot = { left, row }; break; }
        }
        if (spot) break;
      }
      if (!spot) {
        for (const row of ['top', 'bottom']) {
          spot = resolveDrop(SLOT_COL_LEFT[0], row, pot);
          if (spot) break;
        }
      }
      if (!spot) return; // both shelves are full
      stageEl.appendChild(pot);
      pots.push(pot);
      setPotPos(pot, spot.left, spot.row);
      pot.dataset.homeLeft = String(spot.left);
      pot.dataset.homeRow = spot.row;
      updatePotZOrder(pot);
      wirePotDrag(pot);
      wirePotClick(pot);
    }

    document.getElementById('ui-addplant')?.addEventListener('click', addPot);

    // ---------- Drag-and-drop pots (pointer + keyboard) ----------
    // Free-form like the space: horizontal position is continuous
    // (integer design units, clamped to the shelf), vertical position
    // snaps to the nearest shelf row. Overlap is prevented by the
    // per-type detection zone (the visible sprite shrunk by 1 unit
    // per side); a blocked drop slides to the nearest free spot, or
    // snaps back to the drag origin if the row is full.
    const DRAG_THRESHOLD = 3; // design units of pointer travel to start a drag
    let dragState = null; // { pot, startClientX, startClientY, moved, origPos, stageRect }
    let suppressNextPotClick = false;
    let suppressPotClickTimer = 0;
    // Arms the post-drag click suppression (it clears itself
    // after 300 ms). Called the moment a drag starts moving —
    // not only when the drag ends — so the click the release
    // produces is swallowed whenever it arrives.
    function armPotClickSuppression() {
      suppressNextPotClick = true;
      clearTimeout(suppressPotClickTimer);
      suppressPotClickTimer = setTimeout(() => { suppressNextPotClick = false; }, 300);
    }

    // Pointer travel since dragstart, converted to design units.
    function designDelta(e) {
      const w = dragState.stageRect.width || 1;
      const h = dragState.stageRect.height || 1;
      return {
        dx: (e.clientX - dragState.startClientX) * (256 / w),
        dy: (e.clientY - dragState.startClientY) * (144 / h),
      };
    }

    // Drag-to-delete: while a pot is dragged, an X marker floats
    // above the spot the drag started from; dropping the pot on it
    // deletes the pot. The marker box is 13.2x13.2 with the visible
    // X being the centred 6x6 of the sprite.
    const deleteXEl = document.getElementById('drag-delete-x');
    const DELETE_X_SIZE = 13.2;
    const DELETE_X_INK = 6;

    // Where the delete marker sits for a drag that started at pos
    // (design units): centred on the pot, its box top on the row's
    // top edge, so the visible X floats about 9 units above the
    // pot's sprite — half the distance it had when the box top sat
    // 10 units above the row.
    function deleteXBox(pos, lift = 0) {
      return {
        left: pos.left + POT_SIZE / 2 - DELETE_X_SIZE / 2,
        top: SLOT_ROW_TOP[pos.row] - lift,
      };
    }

    function beginPotDrag(pot, e) {
      if (dragState) return;
      if (e.button !== undefined && e.button !== 0) return; // primary pointer only
      // Start the drag on the pot whose sprite contains the pointer,
      // not necessarily the pot whose (larger, overlapping) button box
      // was on top — otherwise a drag starting on a neighbour's sprite
      // would move the wrong pot. The drag zone is the pot's full
      // sprite only: a press on the plant above it does not drag.
      const target = potAtPoint(e.clientX, e.clientY, isInDragZone);
      if (!target) return;
      const stageRect = stageEl.getBoundingClientRect();
      dragState = {
        pot: target,
        startClientX: e.clientX,
        startClientY: e.clientY,
        // The pointer's drag-start position in design units, so the
        // delete marker can hit-test the pointer during the drag.
        startDesignX: (e.clientX - stageRect.left) * (256 / (stageRect.width || 1)),
        startDesignY: (e.clientY - stageRect.top) * (144 / (stageRect.height || 1)),
        moved: false,
        deleteShown: false,
        deleteArmed: false,
        origPos: getPotPos(target),
        stageRect,
      };
      try { target.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    }

    function movePotDrag(e) {
      if (!dragState) return;
      const { dx, dy } = designDelta(e);
      if (!dragState.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!dragState.moved) {
        dragState.moved = true;
        armPotClickSuppression();
        dragState.pot.classList.add('is-dragging');
        // A drag counts even if the pot ends up back where it started:
        // this pot is now the front of its size tier (the previous
        // front of that tier drops back to its base).
        notePotDragged(dragState.pot);
        // Lift above every tier while dragging: the .is-dragging rule
        // (z-index 50) is overridden by an inline tier z-index, so a
        // small pot would otherwise drag underneath its neighbours.
        dragState.pot.style.zIndex = 50;
        // Show the delete marker above the drag's starting spot —
        // unless this is the only pot left: the shelf always keeps
        // one, so a lone pot shows no marker and cannot be deleted.
        if (pots.length > 1 && deleteXEl) {
          const box = deleteXBox(dragState.origPos);
          deleteXEl.style.left = `calc(${box.left}px * var(--scale))`;
          deleteXEl.style.top = `calc(${box.top}px * var(--scale))`;
          deleteXEl.classList.add('is-visible');
          dragState.deleteShown = true;
        }
      }
      e.preventDefault();
      const pot = dragState.pot;
      const orig = dragState.origPos;
      const left = Math.max(POT_MIN_LEFT, Math.min(POT_MAX_LEFT, Math.round(orig.left + dx)));
      // Row from the pot centre's Y: above the midpoint is the top shelf.
      const centreY = SLOT_ROW_TOP[orig.row] + POT_SIZE / 2 + dy;
      const row = centreY < ROW_MID_Y ? 'top' : 'bottom';
      setPotPos(pot, left, row);
      // Blocked feedback while the drop point is occupied.
      pot.classList.toggle('is-blocked', !posIsFree(left, row, pot));
      // Delete arming: the pointer inside the marker's visible X
      // (grown by 4 units so it is easy to hit) arms the delete;
      // releasing the drag then deletes the pot instead of dropping.
      if (dragState.deleteShown) {
        const box = deleteXBox(orig);
        const ink = (DELETE_X_SIZE - DELETE_X_INK) / 2;
        const px = dragState.startDesignX + dx;
        const py = dragState.startDesignY + dy;
        const armed =
          px >= box.left + ink - 4 && px <= box.left + DELETE_X_SIZE - ink + 4 &&
          py >= box.top + ink - 4 && py <= box.top + DELETE_X_SIZE - ink + 4;
        dragState.deleteArmed = armed;
        deleteXEl.classList.toggle('is-armed', armed);
      }
    }

    function endPotDrag(e, cancelled) {
      if (!dragState) return;
      const state = dragState;
      dragState = null;
      const pot = state.pot;
      // A fast flick can deliver no pointermove events at
      // all, so the drag never "started" — but if the release
      // lands far from the press, it was a drag, not a click.
      if (!state.moved && !cancelled && e && typeof e.clientX === 'number' && state.stageRect) {
        const dx = (e.clientX - state.startClientX) * (256 / (state.stageRect.width || 1));
        const dy = (e.clientY - state.startClientY) * (144 / (state.stageRect.height || 1));
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) state.moved = true;
      }
      pot.classList.remove('is-dragging', 'is-blocked');
      // The delete marker only lives for the length of a drag.
      if (deleteXEl) deleteXEl.classList.remove('is-visible', 'is-armed');
      // Restore the size-tier z-index after the drag lift (above).
      if (state.moved) updatePotZOrder(pot);
      if (cancelled || !state.moved) {
        // Plain click, or a cancelled drag: back to the drag origin.
        if (state.moved) setPotPos(pot, state.origPos.left, state.origPos.row);
        return; // plain click — let the click handler open the modal
      }
      armPotClickSuppression();
      // A click is suppressed for 300 ms after a real drag so dragging
      // does not also open a popup.
      if (state.deleteArmed) {
        // Dropped on the delete marker: the pot (and any plant in
        // it) is removed instead of landing anywhere.
        deletePot(pot);
        return;
      }
      const pos = getPotPos(pot);
      const target = resolveDrop(pos.left, pos.row, pot);
      if (!target) {
        setPotPos(pot, state.origPos.left, state.origPos.row); // row full — snap back
        return;
      }
      setPotPos(pot, target.left, target.row);
      if (target.left !== state.origPos.left || target.row !== state.origPos.row) {
        noteFirstPotMoved();
      }
    }

    // Removes a pot from the shelf for good, plant and all (the
    // plant's state lives in the pot's dataset, so it goes with the
    // element). Only called from a drop on the delete marker, which
    // never shows for the last remaining pot.
    function deletePot(pot) {
      const i = pots.indexOf(pot);
      if (i !== -1) pots.splice(i, 1);
      if (activePot === pot) activePot = null;
      pot.remove();
      updateDewDrops();
      saveGarden();
    }

    // Wires one pot's drag + arrow-key handlers. Called for the
    // starting pot at load and for each pot the button adds.
    function wirePotDrag(pot) {
      pot.addEventListener('pointerdown', (e) => {
        // Collecting dew has first precedence: a press anywhere
        // on a plant (or its pot) with drops waiting collects
        // them instead of starting a drag. The click the press
        // goes on to produce is swallowed in wirePotClick, so the
        // popup doesn't open on top of the collection.
        const dewTarget = dewPotAtPoint(e.clientX, e.clientY);
        if (dewTarget) {
          dewSwallowPot = dewTarget;
          collectDew(dewTarget);
          return;
        }
        dewSwallowPot = null; // a fresh press supersedes a pending swallow
        // A press on this pot's clear canvas that lands on a
        // bin's jar belongs to the bin — the jar stays grabbable
        // even where a pot's box overlaps it.
        if (!isInDragZone(pot, e.clientX, e.clientY)) {
          const binTarget = binAtPoint(e.clientX, e.clientY);
          if (binTarget) { beginBinDrag(binTarget, e); return; }
        }
        beginPotDrag(pot, e);
      });
      pot.addEventListener('pointermove', (e) => {
        if (dragState && dragState.pot === pot) movePotDrag(e);
      });
      pot.addEventListener('pointerup', (e) => {
        if (dragState && dragState.pot === pot) endPotDrag(e, false);
      });
      pot.addEventListener('pointercancel', (e) => {
        if (dragState && dragState.pot === pot) endPotDrag(e, true);
      });
      pot.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        // Don't hijack arrows while a modal is open.
        if (modal.classList.contains('is-open') || pdModal.classList.contains('is-open')) return;
        e.preventDefault();
        const pos = getPotPos(pot);
        const step = e.shiftKey ? 10 : 2;
        let left = pos.left;
        let row = pos.row;
        if (e.key === 'ArrowLeft') left = Math.max(POT_MIN_LEFT, pos.left - step);
        if (e.key === 'ArrowRight') left = Math.min(POT_MAX_LEFT, pos.left + step);
        if (e.key === 'ArrowUp') row = 'top';
        if (e.key === 'ArrowDown') row = 'bottom';
        if (left === pos.left && row === pos.row) return;
        if (row !== pos.row) {
          // Row change uses the same nearest-free-spot resolution as a drop.
          const target = resolveDrop(left, row, pot);
          if (!target) return;
          setPotPos(pot, target.left, target.row);
        } else {
          // Same-row move into a blocked spot does nothing.
          if (!posIsFree(left, row, pot)) return;
          setPotPos(pot, left, row);
        }
        noteFirstPotMoved();
      });
    }

    pots.forEach(wirePotDrag);

    const repeatOptions = ['daily', 'weekly', 'monthly', 'yearly'];
    let repeatIndex = 0;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let yearMonthIndex = 0;
    let activePot = null;
    let currentDetailsPot = null;

    // Plant details popup artwork + position, computed from the pot's
    // live position so the popup follows the pot after dragging.
    // The dialog is 236 units wide. Spike offsets measured from the PNG
    // artwork: left art 73, mid art 119, flipped left art 163 (= 236 - 73).
    // Dialog left = pot centre - spike, rounded, which reproduces the
    // original mid configs exactly (c2: -6, c3: 24). Zones follow the
    // pot centre: <98 left art, 98-158 mid art, >158 flipped left art.
    function getPopupConfig(pot) {
      const pos = getPotPos(pot);
      const potCentre = pos.left + POT_SIZE / 2;
      let bg;
      let spike;
      if (potCentre < 98) {
        bg = 'assets/ui-popup-left.png';
        spike = 73;
      } else if (potCentre > 158) {
        bg = 'assets/ui-popup-left.png';
        spike = 163;
      } else {
        bg = 'assets/ui-popup-mid.png';
        spike = 119;
      }
      return {
        bg,
        left: Math.round(potCentre - spike),
        top: pos.row === 'bottom' ? -5 : 28,
        flipX: potCentre > 158,
        flipY: pos.row === 'bottom',
      };
    }

    // Ordinal suffix calculation (1st, 2nd, 3rd, 4th... 11th, 21st, 22nd...)
    function getOrdinalSuffix(val) {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) return 'th';
      const j = num % 10;
      const k = num % 100;
      if (j === 1 && k !== 11) return 'st';
      if (j === 2 && k !== 12) return 'nd';
      if (j === 3 && k !== 13) return 'rd';
      return 'th';
    }

    function updateOrdinal() {
      if (!dayNumInput || !ordinalSuffix) return;
      let raw = dayNumInput.value.replace(/\D/g, '');
      if (raw !== '') {
        let num = parseInt(raw, 10);
        if (num > 31) num = 31;
        if (num < 1) num = 1;
        dayNumInput.value = num;
        ordinalSuffix.textContent = getOrdinalSuffix(num);
      } else {
        ordinalSuffix.textContent = 'th';
      }
      checkCommitReady();
    }

    function updateYearMonth() {
      if (yearMonthVal) yearMonthVal.textContent = monthNames[yearMonthIndex];
      if (yearDayNumInput && yearDayNumInput.value !== '') {
        updateYearOrdinal();
      } else {
        checkCommitReady();
      }
    }

    function updateYearOrdinal() {
      if (!yearDayNumInput || !yearOrdinalSuffix) return;
      let raw = yearDayNumInput.value.replace(/\D/g, '');
      if (raw !== '') {
        let num = parseInt(raw, 10);
        const maxDays = monthDays[yearMonthIndex] || 31;
        if (num > maxDays) num = maxDays;
        if (num < 1) num = 1;
        yearDayNumInput.value = num;
        yearOrdinalSuffix.textContent = getOrdinalSuffix(num);
      } else {
        yearOrdinalSuffix.textContent = 'th';
      }
      checkCommitReady();
    }

    function updateRepeat() {
      const current = repeatOptions[repeatIndex];
      if (repeatVal) repeatVal.textContent = current;
      if (daysPicker) {
        daysPicker.hidden = (current !== 'weekly');
      }
      if (monthlyPicker) {
        monthlyPicker.hidden = (current !== 'monthly');
      }
      if (yearlyPicker) {
        yearlyPicker.hidden = (current !== 'yearly');
      }
      checkCommitReady();
    }

    function checkCommitReady() {
      const hasName = plantInput && plantInput.value.trim().length > 0;
      const hasPlant = document.querySelector('.ap-plant.is-selected') !== null;

      let repeatValid = true;
      const currentRepeat = repeatOptions[repeatIndex];
      if (currentRepeat === 'weekly') {
        repeatValid = document.querySelectorAll('.ap-day-btn.is-active').length > 0;
      } else if (currentRepeat === 'monthly') {
        const val = parseInt(dayNumInput?.value, 10);
        repeatValid = !isNaN(val) && val >= 1 && val <= 31;
      } else if (currentRepeat === 'yearly') {
        const val = parseInt(yearDayNumInput?.value, 10);
        const maxDays = monthDays[yearMonthIndex] || 31;
        repeatValid = !isNaN(val) && val >= 1 && val <= maxDays;
      }

      const isReady = Boolean(hasName && hasPlant && repeatValid);
      if (commitBtn) {
        if (isReady) {
          commitBtn.classList.add('is-ready');
          commitBtn.removeAttribute('disabled');
        } else {
          commitBtn.classList.remove('is-ready');
          commitBtn.setAttribute('disabled', 'true');
        }
      }
      return isReady;
    }

    function resetModal() {
      if (plantInput) plantInput.value = '';
      repeatIndex = 0;
      updateRepeat();

      if (dayNumInput) dayNumInput.value = '';
      if (ordinalSuffix) ordinalSuffix.textContent = 'th';

      yearMonthIndex = getGameDate().getMonth();
      updateYearMonth();
      if (yearDayNumInput) yearDayNumInput.value = '';
      if (yearOrdinalSuffix) yearOrdinalSuffix.textContent = 'th';

      dayBtns.forEach((btn, idx) => {
        const isActive = idx < 2; // Sunday and Monday active by default
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      plantBtns.forEach(btn => btn.classList.remove('is-selected'));
      plantCarouselOffset = 0;
      updatePlantCarousel();
      // The clicked pot's own design starts picked in the
      // picker, so planting into an existing empty pot keeps
      // its design unless another is chosen. A pot with no
      // recorded design (a brand new one) starts on clay.
      const clickedPotIdx = activePot ? potOptions.findIndex(p => p.id === (activePot.dataset.potType || 'clay')) : -1;
      setSelectedPot(clickedPotIdx !== -1 ? clickedPotIdx : 0);
      checkCommitReady();
    }

    function openModal(pot, isEdit = false) {
      activePot = pot || null;
      if (isEdit && activePot) {
        if (apTitle) apTitle.textContent = 'Edit Plant';
        if (apRemove) apRemove.hidden = false;
        if (apUnwater) apUnwater.hidden = false;

        if (plantInput) plantInput.value = activePot.dataset.plantName || '';

        // Match pot
        const savedPotType = activePot.dataset.potType || 'clay';
        const potIdx = potOptions.findIndex(p => p.id === savedPotType);
        setSelectedPot(potIdx !== -1 ? potIdx : 0);

        let rType = activePot.dataset.repeatType;
        if (!rType) {
          const rep = activePot.dataset.repeat || '';
          if (rep === 'daily' || rep === 'weekly' || rep === 'monthly' || rep === 'yearly') {
            rType = rep;
          } else if (rep.startsWith('on the ')) {
            rType = 'monthly';
          } else if (rep.startsWith('on ')) {
            rType = 'yearly';
          } else if (rep.length > 0) {
            rType = 'weekly';
          } else {
            rType = 'daily';
          }
        }
        repeatIndex = repeatOptions.indexOf(rType);
        if (repeatIndex === -1) repeatIndex = 0;
        updateRepeat();

        if (rType === 'weekly') {
          let savedDays = [];
          try {
            if (activePot.dataset.repeatDays) savedDays = JSON.parse(activePot.dataset.repeatDays);
          } catch (e) { }
          if (!savedDays.length && activePot.dataset.repeat) {
            savedDays = activePot.dataset.repeat.split(/\s+/).filter(Boolean);
          }
          dayBtns.forEach(btn => {
            const active = savedDays.includes(btn.textContent.trim().toLowerCase());
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
        } else if (rType === 'monthly') {
          if (dayNumInput) {
            let num = activePot.dataset.repeatDayNum;
            if (!num && activePot.dataset.repeat) {
              const match = activePot.dataset.repeat.match(/\d+/);
              if (match) num = match[0];
            }
            dayNumInput.value = num || '';
            updateOrdinal();
          }
        } else if (rType === 'yearly') {
          if (activePot.dataset.repeatMonth !== undefined) {
            yearMonthIndex = parseInt(activePot.dataset.repeatMonth, 10);
            if (isNaN(yearMonthIndex) || yearMonthIndex < 0 || yearMonthIndex > 11) {
              yearMonthIndex = 0;
            }
          } else if (activePot.dataset.repeat) {
            const matchMonth = activePot.dataset.repeat.match(/on\s+([A-Za-z]+)/);
            if (matchMonth) {
              const idx = monthNames.findIndex(m => m.toLowerCase() === matchMonth[1].toLowerCase());
              if (idx !== -1) yearMonthIndex = idx;
            }
          }
          if (yearDayNumInput) {
            let num = activePot.dataset.repeatDayNum;
            if (!num && activePot.dataset.repeat) {
              const match = activePot.dataset.repeat.match(/\d+/);
              if (match) num = match[0];
            }
            yearDayNumInput.value = num || '';
            updateYearOrdinal();
          }
          updateYearMonth();
        }

        // Match plant
        plantBtns.forEach(b => b.classList.remove('is-selected'));
        let plantType = activePot.dataset.plantType;
        if (!plantType) {
          const img = activePot.querySelector('.pot-plant');
          if (img) {
            const src = img.getAttribute('src') || '';
            if (src.includes('cactus')) plantType = 'cactus';
            else if (src.includes('lavender')) plantType = 'lavender';
            else if (src.includes('white-flowered-tree')) plantType = 'tree';
            else if (src.includes('peace-lily')) plantType = 'lily';
            else if (src.includes('daisy')) plantType = 'daisy';
            else if (src.includes('droopy')) plantType = 'droopy';
          }
        }
        if (plantType) {
          const targetBtn = document.querySelector(`.ap-plant[data-plant="${plantType}"]`);
          if (targetBtn) {
            targetBtn.classList.add('is-selected');
            const allPlants = Array.from(document.querySelectorAll('.ap-plant'));
            const idx = allPlants.indexOf(targetBtn);
            plantCarouselOffset = idx >= 5 ? 1 : 0;
            updatePlantCarousel();
          }
        }

        checkCommitReady();
      } else {
        if (apTitle) apTitle.textContent = 'Grow your good habits';
        if (apRemove) apRemove.hidden = true;
        if (apUnwater) apUnwater.hidden = true;
        resetModal();
      }

      modal.classList.remove('is-closing');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      setTimeout(() => plantInput && plantInput.focus(), 300);
    }

    function closeModal() {
      if (!modal.classList.contains('is-open') || modal.classList.contains('is-closing')) return;
      modal.classList.remove('is-open');
      modal.classList.add('is-closing');
      modal.setAttribute('aria-hidden', 'true');

      // Reset remove button confirm state
      if (apRemove) {
        apRemove.classList.remove('is-confirming');
        apRemove.textContent = 'remove';
      }

      function onAnimationEnd(e) {
        if (e.animationName === 'ap-fall-fade-out') {
          modal.classList.remove('is-closing');
          modal.removeEventListener('animationend', onAnimationEnd);
        }
      }
      modal.addEventListener('animationend', onAnimationEnd);
    }

    function getLocalDateStr(date = getCurrentDate()) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    function calculateStreak(pot) {
      if (!pot) return ['-', '-', '-', '-', '-', '-', '-', '-'];
      // "Today" is the game day (starts 4am), so the last 8
      // opportunities — and with them missed days and death — are
      // counted against the 4am boundary, not midnight.
      const today = getGameDate();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayStr = getLocalDateStr(todayStart);

      let createdDateStr = pot.dataset.createdDate;
      if (!createdDateStr) {
        if (pot.dataset.lastWateredDate) {
          createdDateStr = getLocalDateStr(new Date(pot.dataset.lastWateredDate));
        } else {
          createdDateStr = todayStr;
        }
      }

      let history = [];
      try {
        if (pot.dataset.waterHistory) history = JSON.parse(pot.dataset.waterHistory);
      } catch (e) { }

      if (pot.dataset.wateredToday === 'true' && !history.includes(todayStr)) {
        history.push(todayStr);
      }
      if (pot.dataset.lastWateredDate) {
        const lastIso = getLocalDateStr(new Date(pot.dataset.lastWateredDate));
        if (lastIso && !history.includes(lastIso)) {
          history.push(lastIso);
        }
      }

      const repeatType = pot.dataset.repeatType || 'daily';
      let oppDates = [];

      if (repeatType === 'daily') {
        for (let i = 7; i >= 0; i--) {
          const d = new Date(todayStart);
          d.setDate(todayStart.getDate() - i);
          oppDates.push(d);
        }
        pot.dataset.streakLastOppLabel = 'today';
      } else if (repeatType === 'weekly') {
        let repeatDays = [];
        try {
          if (pot.dataset.repeatDays) repeatDays = JSON.parse(pot.dataset.repeatDays);
        } catch (e) { }
        if (!repeatDays.length && pot.dataset.repeat) {
          repeatDays = pot.dataset.repeat.split(/\s+/).filter(Boolean);
        }
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        let activeIndices = repeatDays.map(d => dayNames.indexOf(d.toLowerCase())).filter(idx => idx !== -1);
        if (!activeIndices.length) {
          activeIndices = [0, 1, 2, 3, 4, 5, 6];
        }

        let cur = new Date(todayStart);
        let found = [];
        while (found.length < 8) {
          if (activeIndices.includes(cur.getDay())) {
            found.push(new Date(cur));
          }
          cur.setDate(cur.getDate() - 1);
        }
        oppDates = found.reverse();

        const lastOpp = oppDates[7];
        const lastOppStr = getLocalDateStr(lastOpp);
        if (lastOppStr === todayStr) {
          pot.dataset.streakLastOppLabel = 'today';
        } else {
          const diffDays = Math.round((todayStart - lastOpp) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            pot.dataset.streakLastOppLabel = 'yesterday';
          } else {
            pot.dataset.streakLastOppLabel = dayNames[lastOpp.getDay()];
          }
        }
      } else if (repeatType === 'monthly') {
        let dayNum = parseInt(pot.dataset.repeatDayNum, 10);
        if (isNaN(dayNum) || dayNum < 1) dayNum = 1;
        if (dayNum > 31) dayNum = 31;

        let curYear = todayStart.getFullYear();
        let curMonth = todayStart.getMonth();
        let mOffset = (todayStart.getDate() >= dayNum) ? 0 : 1;
        for (let i = 7; i >= 0; i--) {
          const targetM = curMonth - (i + mOffset);
          const tempDate = new Date(curYear, targetM + 1, 0);
          const maxD = tempDate.getDate();
          const d = new Date(curYear, targetM, Math.min(dayNum, maxD));
          oppDates.push(d);
        }

        const lastOpp = oppDates[7];
        const lastOppStr = getLocalDateStr(lastOpp);
        if (lastOppStr === todayStr) {
          pot.dataset.streakLastOppLabel = 'today';
        } else {
          pot.dataset.streakLastOppLabel = `${lastOpp.getDate()}${getOrdinalSuffix(lastOpp.getDate())}`;
        }
      } else if (repeatType === 'yearly') {
        let monthIdx = parseInt(pot.dataset.repeatMonth, 10);
        if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) monthIdx = 0;
        let dayNum = parseInt(pot.dataset.repeatDayNum, 10);
        if (isNaN(dayNum) || dayNum < 1) dayNum = 1;
        if (dayNum > 31) dayNum = 31;

        let curYear = todayStart.getFullYear();
        const thisYearOpp = new Date(curYear, monthIdx, dayNum);
        let yOffset = (todayStart >= thisYearOpp) ? 0 : 1;
        for (let i = 7; i >= 0; i--) {
          const d = new Date(curYear - (i + yOffset), monthIdx, dayNum);
          oppDates.push(d);
        }

        const lastOpp = oppDates[7];
        const lastOppStr = getLocalDateStr(lastOpp);
        if (lastOppStr === todayStr) {
          pot.dataset.streakLastOppLabel = 'today';
        } else {
          pot.dataset.streakLastOppLabel = `${monthNames[lastOpp.getMonth()]} ${lastOpp.getDate()}`;
        }
      }

      const streak = [];
      for (let i = 0; i < 8; i++) {
        const oppD = oppDates[i];
        if (!oppD) {
          streak.push('-');
          continue;
        }
        const oppStr = getLocalDateStr(oppD);

        if (oppStr < createdDateStr) {
          streak.push('-');
          continue;
        }

        let isWatered = false;
        if (repeatType === 'daily') {
          isWatered = history.includes(oppStr);
        } else if (repeatType === 'weekly') {
          const prevD = i > 0 ? oppDates[i - 1] : null;
          const prevStr = prevD ? getLocalDateStr(prevD) : null;
          isWatered = history.some(h => {
            if (prevStr && h <= prevStr) return false;
            if (i === 7 && oppStr < todayStr) {
              return h >= oppStr && h <= todayStr;
            }
            return h >= (prevStr ? prevStr : oppStr) && h <= oppStr;
          });
          if (!isWatered) isWatered = history.includes(oppStr);
        } else if (repeatType === 'monthly') {
          const y = oppD.getFullYear();
          const m = oppD.getMonth();
          isWatered = history.some(h => {
            const [hy, hm] = h.split('-').map(Number);
            return hy === y && (hm - 1) === m;
          });
        } else if (repeatType === 'yearly') {
          const y = oppD.getFullYear();
          isWatered = history.some(h => {
            const [hy] = h.split('-').map(Number);
            return hy === y;
          });
        }

        if (isWatered) {
          streak.push('check');
        } else {
          streak.push('x');
        }
      }

      return streak;
    }

    function getMissedOpportunitiesCount(pot) {
      if (!pot || !pot.classList.contains('has-plant')) return 0;
      const todayStr = getGameDayStr();
      if (pot.dataset.wateredToday === 'true' && pot.dataset.lastWateredDate === todayStr) {
        return 0;
      }

      const streak = calculateStreak(pot);
      let startIndex = 6;
      if (pot.dataset.streakLastOppLabel && pot.dataset.streakLastOppLabel !== 'today') {
        startIndex = 7;
      }

      let missed = 0;
      for (let i = startIndex; i >= 0; i--) {
        if (streak[i] === 'x') {
          missed++;
        } else {
          break;
        }
      }
      return missed;
    }

    function updatePotVisuals(pot, holdRevive) {
      if (!pot || !pot.classList.contains('has-plant')) return;
      const potPlant = pot.querySelector('.pot-plant');
      if (!potPlant) return;

      const todayStr = getGameDayStr();
      const isWateredToday = (pot.dataset.wateredToday === 'true') && (pot.dataset.lastWateredDate === todayStr);

      const missedCount = isWateredToday ? 0 : getMissedOpportunitiesCount(pot);

      if (missedCount >= 1) {
        // Missing watering resets the growth counter
        pot.dataset.waterCount = '0';
      }

      const isGrown = pot.dataset.stage === 'grown';
      const normalImg = isGrown ? (pot.dataset.grownPlantImg || 'assets/bud-4.png') : 'assets/bud-4.png';

      if (missedCount >= 1) {
        // Missed once -> dead
        if (isGrown) {
          // Dead grown plant (pick random from the 4 dead plants if not already assigned)
          if (!pot.dataset.deadPlantImg || pot.dataset.deadPlantImg === 'assets/dead-bud.png') {
            const deadPlantOptions = [
              'assets/dead-plant-1.png',
              'assets/dead-plant-3.png',
              'assets/dead-plant-4.png',
              'assets/dead-plant-5.png'
            ];
            pot.dataset.deadPlantImg = deadPlantOptions[Math.floor(Math.random() * deadPlantOptions.length)];
          }
        } else {
          // Dead bud
          pot.dataset.deadPlantImg = 'assets/dead-bud.png';
        }
        potPlant.src = pot.dataset.deadPlantImg;
        potPlant.alt = `${pot.dataset.plantName || 'Plant'} (dead)`;
        potPlant.classList.add('is-dead');
        pot.dataset.plantState = 'dead';
      } else if (holdRevive && pot.dataset.plantState === 'dead') {
        // Revived by this watering, but the reveal is held:
        // the plant keeps its dead look until the caller runs
        // this again a moment later (once the water has hit).
      } else {
        // Healthy, missed once, or revived
        delete pot.dataset.deadPlantImg;
        potPlant.src = normalImg;
        potPlant.alt = isGrown ? (pot.dataset.plantName || '') : `${pot.dataset.plantName || ''} (bud)`;
        potPlant.classList.remove('is-dead');
        pot.dataset.plantState = 'healthy';
      }

      // The day's dew drops depend on every plant's state.
      updateDewDrops();
    }

    function updateAllPotVisuals() {
      pots.forEach(pot => {
        if (pot.classList.contains('has-plant')) {
          updatePotVisuals(pot);
        }
      });
    }

    // ---- Dew drops ----
    // The currency is rewarded ONLY at the start of each game day
    // (4am): at that moment the day's amount is worked out from the
    // plants on the shelf as they stand, and it then stays fixed
    // for the whole day — planting, watering, reviving or removing
    // a plant during the day changes nothing until the next 4am,
    // when the next day's reward is granted. Dead plants are the
    // one exception to hand collection: their −2 is taken
    // automatically at day start, and the total can go below 0:
    //   bud ....... 1 drop a day
    //   dead ...... -2 drops a day
    //   flower .... 5 (daily/weekly), 10 (monthly) or 20 (yearly)
    //               on the day after it was watered, 2 a day after
    const dewModal = document.getElementById('dew-modal');
    // The game day the current dew assignment was decided for (an
    // ISO date string). null = not decided yet this session, so
    // the first updateDewDrops() of a day decides that day.
    let dewRewardDayStr = null;

    function dewDropRate(pot) {
      if (!pot.classList.contains('has-plant')) return 0;
      if (getMissedOpportunitiesCount(pot) >= 1) return -2; // dead
      if (pot.dataset.stage !== 'grown') return 1; // bud
      // A flower pays its big rate on the day after a watering.
      let history = [];
      try {
        if (pot.dataset.waterHistory) history = JSON.parse(pot.dataset.waterHistory);
      } catch (e) { }
      const yesterday = getGameDate();
      yesterday.setDate(yesterday.getDate() - 1);
      if (!history.includes(getLocalDateStr(yesterday))) return 2;
      const repeatType = pot.dataset.repeatType || 'daily';
      if (repeatType === 'monthly') return 10;
      if (repeatType === 'yearly') return 20;
      return 5; // daily and weekly
    }

    // ---- Dew collection ----
    // Drops are not handed out automatically any more — except a
    // dead plant's −2, which is taken automatically at the start
    // of a game day (see updateDewDrops): at the start of a game
    // day each plant is assigned the drops it can pay that day
    // (dewDropRate, from the plant as it stands then). The
    // assignment is kept on the plant itself and saved
    // with the garden: dataset.dewToday is the amount waiting,
    // dataset.dewCollected marks it taken, and dataset.dewDay is
    // the game day the assignment was decided for. A plant whose
    // dewDay is today is NEVER reassigned that day — so collected
    // drops stay collected across refreshes, sign-ins and
    // devices, and only a new game day (a different dewDay)
    // decides afresh. A plant with drops waiting wears the drop
    // icon above it (see renderDew); clicking the icon flies a
    // drop to the currency pill, and only when it lands does the
    // count go up. Uncollected drops are gone when the next day
    // starts, and a plant added today is assigned nothing until
    // tomorrow (planting stamps it decided-for-today with no
    // amount — see the commit handler).

    function collectedDewTotal() {
      // The total can go below 0: a dead plant's −2 is collected
      // automatically (see updateDewDrops), so it counts here
      // alongside the drops collected by hand.
      let total = 0;
      pots.forEach(pot => {
        if (pot.dataset.dewCollected === 'true') {
          total += parseInt(pot.dataset.dewToday || '0', 10) || 0;
        }
      });
      return total;
    }

    function updateDewDrops() {
      const todayStr = getLocalDateStr(getGameDate());
      dewRewardDayStr = todayStr;
      let assigned = false;
      pots.forEach(pot => {
        if (!pot.classList.contains('has-plant')) return;
        if (pot.dataset.dewDay === todayStr) return; // decided for today — collected stays collected
        // This plant's day has not been decided yet: a new game
        // day, a freshly restored garden from an earlier day, or
        // a plant that was not there at day start (those are
        // stamped too, with nothing to collect, so they cannot
        // be assigned again until tomorrow). Plants that pay get
        // an amount to collect; a dead plant's −2 is taken at
        // once instead — no icon, no click — and wears no icon.
        const rate = dewDropRate(pot);
        if (rate > 0) {
          pot.dataset.dewToday = String(rate);
          delete pot.dataset.dewCollected;
        } else if (rate < 0) {
          pot.dataset.dewToday = String(rate);
          pot.dataset.dewCollected = 'true';
        } else {
          delete pot.dataset.dewToday;
          delete pot.dataset.dewCollected;
        }
        pot.dataset.dewDay = todayStr;
        assigned = true;
      });
      if (assigned) saveGarden();
      const el = document.getElementById('ui-currency-count');
      if (el) {
        el.textContent = String(collectedDewTotal());
        // While a dead plant's −2 is part of today's total, the
        // count wears the penalty colour.
        if (pots.some(pot => (parseInt(pot.dataset.dewToday || '0', 10) || 0) < 0)) {
          el.classList.add('is-penalty');
        } else {
          el.classList.remove('is-penalty');
        }
      }
      pots.forEach(pot => renderDew(pot));
    }

    // How far each plant's visible artwork reaches, in design
    // units at full size — [width, height, left edge] of the
    // sprite's ink, measured from the PNGs (not the canvas: the
    // bud's canvas is 48 tall but its ink is a 3x2 sprout at the
    // bottom). Used to sit the dew icon and the dew scatter on
    // the plant itself, and for the plant's click/collect zone
    // (plantInkBox). Keyed by a substring of the plant sprite's
    // file name; the dead-plant row covers all four dead-plant
    // variants with their union box.
    const PLANT_INK = [
      ['bud-4', 3, 2, 14],
      ['cactus', 16, 9, 8],
      ['daisy', 22, 17, 5],
      ['lavender', 24, 28, 3],
      ['peace-lily', 28, 24, 3],
      ['droopy', 19, 18, 6],
      ['tree', 18, 14, 7],
      ['dead-bud', 3, 2, 14],
      ['dead-plant', 13, 13, 9],
    ];

    function plantSpriteSrc(pot) {
      const img = pot.querySelector('.pot-plant');
      return img ? (img.src || '') : '';
    }

    function plantInkSize(pot) {
      const src = plantSpriteSrc(pot);
      for (const [key, w, h, left] of PLANT_INK) {
        if (src.includes(key)) return { w, h, left };
      }
      return { w: 20, h: 16, left: 6 };
    }

    // Plants render smaller on the smaller pot sizes (the same
    // 0.75 / 0.5 the .pot-plant CSS rules use).
    function plantRenderScale(pot) {
      const type = pot.dataset.potType || '';
      if (type.endsWith('smallest')) return 0.5;
      if (type.endsWith('smaller')) return 0.75;
      return 1;
    }

    // Show or hide a pot's dew icon and dew-drop scatter so they
    // match its collection state. Rebuilds only when the state
    // actually changes, so the scatter stays put while you look
    // at it (this runs on every pot-visuals refresh).
    function renderDew(pot) {
      if (!pot) return;
      const show = pot.classList.contains('has-plant')
        && !!pot.dataset.dewToday
        && pot.dataset.dewCollected !== 'true';
      const state = show
        ? `on:${pot.dataset.dewToday}:${pot.dataset.stage || ''}:${pot.dataset.plantType || ''}:${pot.dataset.potType || ''}`
        : 'off';
      if (pot._dewState === state) return;
      pot._dewState = state;
      if (pot._dewIconEl) { pot._dewIconEl.remove(); pot._dewIconEl = null; }
      if (pot._dewEffectEl) { pot._dewEffectEl.remove(); pot._dewEffectEl = null; }
      if (!show) return;

      const seat = getPotSprite(pot).h;
      const ink = plantInkSize(pot);
      const pScale = plantRenderScale(pot);

      // The dew effect: little drops (the drop2/drop3 sprites —
      // a single light pixel in a 16px canvas, so each is drawn
      // 16x the size its dot should appear) scattered on and
      // around the plant, each pulsing bigger and smaller at its
      // own random pace.
      const effect = document.createElement('div');
      effect.className = 'dew-effect';
      for (let i = 0; i < 8; i++) {
        const d = document.createElement('img');
        d.src = i % 2 ? 'assets/drop3.png' : 'assets/drop2.png';
        d.className = 'dew-drop';
        d.alt = '';
        const box = (0.5 + Math.random() * 1) * 16;
        const x = 16 + (Math.random() * 2 - 1) * (ink.w * pScale / 2 + 3);
        const y = seat + 1 + Math.random() * (ink.h * pScale + 1);
        // Remember where this drop sits (its centre, in pot-box
        // units): when the dew is collected, the scatter drifts
        // outwards from the plant — see animateDewScatterOut.
        d.dataset.x = x.toFixed(1);
        d.dataset.y = y.toFixed(1);
        d.style.width = `calc(${box.toFixed(1)}px * var(--scale))`;
        d.style.height = `calc(${box.toFixed(1)}px * var(--scale))`;
        d.style.left = `calc(${(x - box / 2).toFixed(1)}px * var(--scale))`;
        d.style.bottom = `calc(${(y - box / 2).toFixed(1)}px * var(--scale))`;
        d.style.animationDuration = `${(1.4 + Math.random() * 1.8).toFixed(2)}s`;
        d.style.animationDelay = `${(-Math.random() * 2).toFixed(2)}s`;
        effect.appendChild(d);
      }
      pot.appendChild(effect);
      pot._dewEffectEl = effect;

      // The collect icon, hovering just above the plant.
      const icon = document.createElement('img');
      icon.src = 'assets/drop1.png';
      icon.className = 'dew-icon';
      icon.alt = 'collect dew drops';
      icon.style.bottom = `calc(${(seat + ink.h * pScale + 2).toFixed(1)}px * var(--scale))`;
      icon.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        collectDew(pot);
      });
      pot.appendChild(icon);
      pot._dewIconEl = icon;
    }

    // Collect one plant's drops: drop(s) fly from the floating
    // drop icon to the currency pill, and the count goes up
    // as they land.
    // The dew scatter's send-off when its plant is collected:
    // each little drop drifts away from the plant's centre
    // while a separate slow fade, starting immediately,
    // finishes 0.4s before the drift does; then the effect
    // element is removed. The drift is added on top of the drops' pulsing
    // (composite: 'add'), so they keep their gentle
    // grow-shrink while they leave. Movement and fade are two
    // animations so each keeps its own easing (one shared
    // easing would rush the fade's start).
    // The move's velocity follows 1 - t^2 — the right half of
    // y = -x^2, flipped up to start at full speed: quick at
    // first, slowing more and more, landing exactly at rest.
    // As a cubic-bezier that curve is exact, not approximate.
    // The movement plays at x0.9 speed (the 800ms timing
    // below, stretched by x0.75 then quickened by x1.2), and
    // every drop starts at once — no stagger.
    function animateDewScatterOut(pot, effect) {
      const drops = Array.from(effect.children || []);
      if (!drops.length || typeof drops[0].animate !== 'function') { effect.remove(); return; }
      const seat = getPotSprite(pot).h;
      const ink = plantInkSize(pot);
      const pScale = plantRenderScale(pot);
      const centreX = 16;
      const centreY = seat + ink.h * pScale / 2; // bottom-based design units
      const rect = pot.getBoundingClientRect();
      const unit = rect && rect.width ? rect.width / POT_SIZE : 1; // px per design unit
      const DURATION = 889; // the 800ms drift at x0.9 speed (x0.75, then quickened x1.2)
      const FADE = DURATION - 400; // the fade finishes 0.4s before the drift does
      let remaining = drops.length * 2; // a move and a fade per drop
      const done = () => { remaining -= 1; if (remaining <= 0) effect.remove(); };
      const watch = (anim) => {
        if (anim && anim.finished && typeof anim.finished.then === 'function') anim.finished.then(done, done);
        else done();
      };
      drops.forEach((d, i) => {
        const x = parseFloat(d.dataset.x || '16');
        const y = parseFloat(d.dataset.y || String(centreY));
        let dx = x - centreX;
        let dy = y - centreY;
        const len = Math.hypot(dx, dy);
        if (len < 0.01) { dx = i % 2 ? 1 : -1; dy = 1; } else { dx /= len; dy /= len; }
        const dist = 3.5 + Math.random() * 3; // design units further out
        // CSS transforms are top-based, so an outward move in
        // bottom-based y is a negative translateY.
        try {
          watch(d.animate([
            { transform: 'translate(0px, 0px)' },
            { transform: `translate(${(dx * dist * unit).toFixed(1)}px, ${(-dy * dist * unit).toFixed(1)}px)` },
          ], { duration: DURATION, easing: 'cubic-bezier(0.333, 0.5, 0.667, 1)', fill: 'forwards', composite: 'add' }));
        } catch (e) { done(); }
        try {
          watch(d.animate([
            { opacity: 1 },
            { opacity: 0 },
          ], { duration: FADE, easing: 'linear', fill: 'forwards' }));
        } catch (e) { done(); }
      });
      // Sweep up in case a finish never reports back.
      setTimeout(() => { if (effect.parentNode) effect.remove(); }, DURATION + 400);
    }

    function collectDew(pot) {
      if (!pot || !pot.dataset.dewToday || pot.dataset.dewCollected === 'true') return;
      // The drops shoot from the floating drop icon above the
      // plant (its rect, captured before collecting removes it).
      const iconEl = pot._dewIconEl;
      const iconRect = iconEl && typeof iconEl.getBoundingClientRect === 'function' ? iconEl.getBoundingClientRect() : null;
      const from = iconRect && iconRect.width ? iconRect : null;
      // Take the scatter out of renderDew's hands so it can
      // drift out and fade instead of vanishing on the spot.
      const effect = pot._dewEffectEl;
      if (effect) {
        pot._dewEffectEl = null;
        animateDewScatterOut(pot, effect);
      }
      pot.dataset.dewCollected = 'true';
      renderDew(pot);
      saveGarden();

      const finish = () => {
        updateDewDrops();
        const pill = document.getElementById('ui-currency');
        if (pill) {
          pill.classList.remove('is-pop');
          void pill.offsetWidth;
          pill.classList.add('is-pop');
        }
      };

      const pill = document.getElementById('ui-currency');
      const to = pill && pill.getBoundingClientRect ? pill.getBoundingClientRect() : null;
      if (!from || !to || !from.width || !to.width) { finish(); return; }
      const host = document.body || document.querySelector('.home-screen');
      if (!host) { finish(); return; }

      // A plant paying several drops: that many drops shoot
      // out of the icon, each on its own trajectory — its own
      // bow, lift and timing — all converging on the pill.
      // The count ticks up by one as each drop lands. (One
      // drop keeps the single flight below.)
      const amount = parseInt(pot.dataset.dewToday || '1', 10) || 1;
      if (amount > 1) {
        const totalBefore = collectedDewTotal() - amount;
        const pillCx = to.left + to.width / 2;
        const pillCy = to.top + to.height / 2;
        const fromCx = from.left + from.width / 2;
        const fromCy = from.top + from.height / 2;
        let landed = 0;
        let settled = false;
        const settle = () => { if (settled) return; settled = true; updateDewDrops(); };
        const onLand = () => {
          landed += 1;
          const el = document.getElementById('ui-currency-count');
          if (el) el.textContent = String(totalBefore + landed);
          const pillEl = document.getElementById('ui-currency');
          if (pillEl) {
            pillEl.classList.remove('is-pop');
            void pillEl.offsetWidth;
            pillEl.classList.add('is-pop');
          }
          if (landed >= amount) settle();
        };
        setTimeout(settle, 1800); // sweep: never leave the count mid-flight
        for (let i = 0; i < amount; i++) {
          const drop = document.createElement('img');
          drop.src = 'assets/drop1.png';
          drop.className = 'dew-flyer';
          drop.alt = '';
          const jx = (Math.random() - 0.5) * 6;
          const jy = (Math.random() - 0.5) * 6;
          drop.style.left = `${from.left + jx}px`;
          drop.style.top = `${from.top + jy}px`;
          drop.style.width = `${from.width}px`;
          drop.style.height = `${from.height}px`;
          host.appendChild(drop);
          setTimeout(() => { drop.remove(); }, 1700); // sweep, in case a finish never reports
          const dx = pillCx - (fromCx + jx);
          const dy = pillCy - (fromCy + jy);
          const len = Math.hypot(dx, dy) || 1;
          const bow = (Math.random() - 0.5) * 90; // sideways curve, either way
          const mx = dx * (0.4 + Math.random() * 0.2) + (-dy / len) * bow;
          const my = dy * (0.4 + Math.random() * 0.2) + (dx / len) * bow - (20 + Math.random() * 50);
          // Fly a smooth curve through the drop's mid point
          // instead of two straight legs with a hard corner
          // halfway: a quadratic curve whose control point is
          // doubled out, so the path passes through the
          // intended mid point, sampled into keyframes.
          const qx = 2 * mx - dx / 2;
          const qy = 2 * my - dy / 2;
          const quadAt = (p0, p1, p2, t) => {
            const u = 1 - t;
            return u * u * p0 + 2 * u * t * p1 + t * t * p2;
          };
          const frames = [];
          for (let s = 0; s <= 4; s++) {
            const t = s / 4;
            frames.push({
              transform: `translate(${quadAt(0, qx, dx, t).toFixed(1)}px, ${quadAt(0, qy, dy, t).toFixed(1)}px) scale(${(1 - 0.7 * Math.pow(t, 1.5)).toFixed(2)})`,
            });
          }
          const land = () => { drop.remove(); onLand(); };
          if (typeof drop.animate === 'function') {
            const anim = drop.animate(frames, { duration: Math.max(850 + Math.random() * 300, len * 0.7), easing: 'cubic-bezier(.45,.02,.65,.6)', fill: 'forwards' });
            if (anim && anim.finished && typeof anim.finished.then === 'function') {
              anim.finished.then(land).catch(land);
            } else {
              setTimeout(land, 1250);
            }
          } else {
            land();
          }
        }
        return;
      }

      const flyer = document.createElement('img');
      flyer.src = 'assets/drop1.png';
      flyer.className = 'dew-flyer';
      flyer.alt = '';
      flyer.style.left = `${from.left}px`;
      flyer.style.top = `${from.top}px`;
      flyer.style.width = `${from.width}px`;
      flyer.style.height = `${from.height}px`;
      host.appendChild(flyer);
      const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
      const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
      if (typeof flyer.animate === 'function') {
        const anim = flyer.animate([
          { transform: 'translate(0px, 0px) scale(1)' },
          { transform: `translate(${(dx * 0.5).toFixed(1)}px, ${(dy * 0.5 - 44).toFixed(1)}px) scale(0.8)`, offset: 0.55 },
          { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(0.3)` },
        ], { duration: 650, easing: 'cubic-bezier(.45,.02,.65,.6)', fill: 'forwards' });
        if (anim && anim.finished && typeof anim.finished.then === 'function') {
          anim.finished.then(() => { flyer.remove(); finish(); }).catch(() => { flyer.remove(); finish(); });
        } else {
          setTimeout(() => { flyer.remove(); finish(); }, 680);
        }
      } else {
        flyer.remove();
        finish();
      }
    }

    // Called when the signed-in identity changes. There is no
    // shared grant to forget any more: each garden's plants carry
    // their own dew day stamps, so a restored garden simply keeps
    // the assignment it was saved with (today's stamps stay
    // decided — collected stays collected — and older stamps are
    // re-decided per plant by updateDewDrops). Just make the next
    // updateDewDrops() re-check the day from scratch.
    function resetDewGrant() {
      dewRewardDayStr = null;
    }

    // Runs when the game day may have rolled over (the 4am timer
    // below, dev date changes): first re-judge every plant against
    // the new day — a plant whose watering was due yesterday and
    // was missed is dead from 4am — then assign the new day's
    // dew drops (updatePotVisuals/updateDewDrops do the assigning).
    function checkDayRollover() {
      if (dewRewardDayStr === getLocalDateStr(getGameDate())) return;
      updateAllPotVisuals();
      updateDewDrops();
      resetBinPetalsForNewDay();
    }

    // Watch for the 4am rollover while the page sits open.
    setInterval(checkDayRollover, 30000);

    function openDewModal() {
      if (!dewModal) return;
      updateDewDrops();
      dewModal.classList.remove('is-closing');
      dewModal.classList.add('is-open');
      dewModal.setAttribute('aria-hidden', 'false');
    }

    function closeDewModal() {
      if (!dewModal || !dewModal.classList.contains('is-open') || dewModal.classList.contains('is-closing')) return;
      dewModal.classList.remove('is-open');
      dewModal.classList.add('is-closing');
      dewModal.setAttribute('aria-hidden', 'true');
      function onAnimationEnd(e) {
        if (e.animationName === 'ap-fall-fade-out') {
          dewModal.classList.remove('is-closing');
          dewModal.removeEventListener('animationend', onAnimationEnd);
        }
      }
      dewModal.addEventListener('animationend', onAnimationEnd);
    }

    document.getElementById('ui-currency')?.addEventListener('click', openDewModal);
    document.getElementById('dd-close')?.addEventListener('click', closeDewModal);
    dewModal?.addEventListener('click', (e) => {
      if (e.target === dewModal) closeDewModal();
    });

    // ---- Accounts & saving ----
    // Signing in (with Google, through Firebase) ties the garden
    // to an account: while signed in, every change (planting,
    // watering, moving, adding or deleting a pot) is saved to the
    // account's row in the cloud database, and on any device the
    // saved garden is rebuilt exactly as it was — pots, positions,
    // plant kinds, schedules and watering history, which is
    // everything the game itself runs on.
    const GARDEN_KEY_PREFIX = 'hg.garden.v1.';
    // The email of the Google account signed in in THIS tab,
    // kept in the tab's session storage (the ss* helpers below)
    // so several tabs can be signed in as different accounts
    // at once. Firebase keeps the real session itself (also
    // per tab — see the bridge at the end of the page); this
    // flag only tells a fresh page load "a garden restore is
    // coming" (the cloud hook below does it when Firebase
    // reports in).
    const CLOUD_EMAIL_KEY = 'hg.cloudEmail.v1';
    // The last garden that was on this shelf, kept in the
    // browser (with the email of the account it belongs to,
    // or null for a signed-out garden) so a new visit opens
    // with it — see the restore near the end of the page.
    const LAST_GARDEN_KEY = 'hg.lastGarden.v1';
    // Whose garden is on the shelf right now, as far as this
    // page knows: an account email, or null for a garden that
    // grew here signed out. The sign-in hook reads it to keep
    // one account's garden from ever being adopted into
    // another account.
    let shelfGardenOwner = null;
    let signedInEmail = null;
    let restoringGarden = false;

    function lsGet(key) {
      try {
        const v = window.localStorage.getItem(key);
        return v === null ? null : JSON.parse(v);
      } catch (e) { return null; }
    }
    function lsSet(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
    }
    function lsRemove(key) {
      try { window.localStorage.removeItem(key); } catch (e) { }
    }
    // The same three helpers over the tab's session storage —
    // per tab, gone when the tab closes.
    function ssGet(key) {
      try {
        const v = window.sessionStorage.getItem(key);
        return v === null ? null : JSON.parse(v);
      } catch (e) { return null; }
    }
    function ssSet(key, value) {
      try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
    }
    function ssRemove(key) {
      try { window.sessionStorage.removeItem(key); } catch (e) { }
    }

    // Accounts live with Firebase now (Google sign-in + a cloud
    // database — the small bridge script at the end of the page).
    // Gardens are still mirrored into this browser's storage under
    // the keys above: the mirror is the adoption source the first
    // time an account signs in here (see hgCloudHook below) and a
    // handy local copy after that.

    // The dataset fields that carry a plant. Streak, dead/healthy
    // state and dew drops are all worked out from these, so they
    // do not need saving of their own.
    const PLANT_DATA_KEYS = ['plantName', 'plantType', 'grownPlantImg', 'repeatType', 'repeatDays', 'repeatDayNum', 'repeatMonth', 'repeat', 'stage', 'waterCount', 'growThreshold', 'wateredToday', 'lastWateredDate', 'createdDate', 'waterHistory', 'dewToday', 'dewCollected', 'dewDay'];

    function serializeGarden() {
      const entries = pots.map(pot => {
        const pos = getPotPos(pot);
        const entry = {
          left: pos.left,
          row: pos.row,
          homeLeft: pot.dataset.homeLeft !== undefined ? pot.dataset.homeLeft : String(pos.left),
          homeRow: pot.dataset.homeRow || pos.row,
          potType: pot.dataset.potType || null,
          plant: null,
        };
        if (pot.classList.contains('has-plant')) {
          const plant = {};
          PLANT_DATA_KEYS.forEach(k => { if (pot.dataset[k] !== undefined) plant[k] = pot.dataset[k]; });
          entry.plant = plant;
        }
        return entry;
      });
      // Bins ride along in the same bundle, after the pots, so a
      // saved garden (and the live sync) carries them too.
      for (const bin of bins) {
        const f = getBinFlower(bin);
        entries.push({
          bin: true,
          left: Number(bin.dataset.binLeft),
          row: bin.dataset.binRow,
          flower: f ? { name: f.name, type: f.type, created: f.created, petalsLeft: f.petalsLeft, petalsDay: f.petalsDay || '', drops: f.drops } : null,
        });
      }
      return entries;
    }

    // A canonical print of a garden bundle (object keys sorted),
    // so two copies of the same garden compare equal however
    // the database ordered the fields. Used to tell another
    // device's changes apart from the echo of our own saves.
    const bundleJson = (b) => JSON.stringify(b, (k, v) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        return Object.keys(v).sort().reduce((o, key) => { o[key] = v[key]; return o; }, {});
      }
      return v;
    });
    let lastSavedBundleJson = '';

    function saveGarden() {
      if (restoringGarden) return;
      const bundle = serializeGarden();
      // The last garden on this shelf is kept in the browser
      // whoever it belongs to (even a signed-out one), so the
      // next visit opens with it.
      lsSet(LAST_GARDEN_KEY, { email: signedInEmail || null, bundle });
      if (!signedInEmail) return;
      lastSavedBundleJson = bundleJson(bundle);
      lsSet(GARDEN_KEY_PREFIX + signedInEmail, bundle);
      // The same bundle goes to the account's cloud row, so the
      // garden follows the account to any device.
      if (window.hgCloud && window.hgCloud.save) {
        try { window.hgCloud.save(bundle); } catch (e) { }
      }
    }

    // Apply a saved pot style: the same end state the Add Plant
    // COMMIT produces (sprite, size classes, paint order).
    function applyPotType(pot, id) {
      const potData = potOptions.find(p => p.id === id);
      if (!potData) return;
      pot.dataset.potType = potData.id;
      updatePotZOrder(pot);
      pot.style.backgroundImage = `url("${potData.src}")`;
      pot.classList.remove('pot--white', 'pot--blue', 'pot--yellow', 'pot--white-smallest', 'pot--orange', 'pot--grey', 'pot--orange-smaller', 'pot--white-smaller', 'pot--blue-smaller', 'pot--yellow-smaller', 'pot--grey-smaller', 'pot--orange-smallest', 'pot--yellow-smallest', 'pot--blue-smallest', 'pot--grey-smallest');
      if (potData.id === 'white') pot.classList.add('pot--white');
      if (potData.id === 'blue') pot.classList.add('pot--blue');
      if (potData.id === 'yellow') pot.classList.add('pot--yellow');
      if (potData.id === 'white-smallest') pot.classList.add('pot--white-smallest');
      if (potData.id === 'orange') pot.classList.add('pot--orange');
      if (potData.id === 'grey') pot.classList.add('pot--grey');
      if (potData.id === 'orange-smaller') pot.classList.add('pot--orange-smaller');
      if (potData.id === 'white-smaller') pot.classList.add('pot--white-smaller');
      if (potData.id === 'blue-smaller') pot.classList.add('pot--blue-smaller');
      if (potData.id === 'yellow-smaller') pot.classList.add('pot--yellow-smaller');
      if (potData.id === 'grey-smaller') pot.classList.add('pot--grey-smaller');
      if (potData.id === 'orange-smallest') pot.classList.add('pot--orange-smallest');
      if (potData.id === 'yellow-smallest') pot.classList.add('pot--yellow-smallest');
      if (potData.id === 'blue-smallest') pot.classList.add('pot--blue-smallest');
      if (potData.id === 'grey-smallest') pot.classList.add('pot--grey-smallest');
    }

    // Rebuild a saved garden (see serializeGarden). The first saved
    // pot reuses the pot already on the shelf; extra pots come from
    // the add-a-pot code, then everything is put back in place.
    function restoreGarden(entries) {
      if (!Array.isArray(entries) || entries.length === 0) return;
      // The bundle is the pot entries followed by any bin entries.
      const binEntries = entries.filter(e => e && e.bin);
      const potEntries = entries.filter(e => !(e && e.bin));
      restoringGarden = true;
      while (pots.length > potEntries.length) {
        const extra = pots[pots.length - 1];
        pots.splice(pots.length - 1, 1);
        extra.remove();
      }
      while (pots.length < potEntries.length) {
        const before = pots.length;
        addPot();
        if (pots.length === before) break; // both shelves are full
      }
      let anyPlant = false;
      potEntries.forEach((entry, i) => {
        const pot = pots[i];
        if (!pot) return;
        setPotPos(pot, entry.left, entry.row);
        pot.dataset.homeLeft = entry.homeLeft;
        pot.dataset.homeRow = entry.homeRow;
        if (entry.potType) applyPotType(pot, entry.potType);
        if (entry.plant) {
          anyPlant = true;
          pot.classList.add('has-plant');
          let potPlant = pot.querySelector('.pot-plant');
          if (!potPlant) {
            potPlant = document.createElement('img');
            potPlant.className = 'pot-plant';
            pot.appendChild(potPlant);
          }
          PLANT_DATA_KEYS.forEach(k => {
            if (entry.plant[k] !== undefined) pot.dataset[k] = entry.plant[k];
          });
          pot.setAttribute('aria-label', `${entry.plant.plantName || 'Plant'} plant`);
          pot.dataset.streak = JSON.stringify(calculateStreak(pot));
          updatePotVisuals(pot);
        } else if (pot.classList.contains('has-plant')) {
          // The bundle says this pot is empty: clear any plant
          // still on it here (a plant removed on another device
          // is removed everywhere; an account switch's fresh
          // shelf starts empty too).
          removePlant(pot);
        }
      });
      // Bins are rebuilt from scratch to match the bundle.
      while (bins.length) removeBin(bins[bins.length - 1]);
      for (const be of binEntries) {
        const bin = createBin(be.left, be.row);
        if (bin && be.flower) {
          setBinFlower(bin, {
            name: be.flower.name || '',
            type: be.flower.type || 'placeholder',
            created: be.flower.created || '',
            petalsLeft: be.flower.petalsLeft !== undefined ? be.flower.petalsLeft : BIN_PETALS,
            petalsDay: be.flower.petalsDay || '',
            drops: be.flower.drops || {},
          });
        }
      }
      restoringGarden = false;
      if (anyPlant) {
        // A saved garden means the intro is long finished: skip
        // the hint flow and reveal the corner stack right away.
        hasPlantedFirstPlant = true;
        hasWateredFirstPlant = true;
        hasMovedFirstPot = true;
        updateHint();
      }
      // A garden restored on a new day: its bin flowers have
      // grown their petals back overnight.
      resetBinPetalsForNewDay();
    }

    // ---------- Bins: bad-habit flowers ----------
    // A bin is a jar on the shelf, added with the add-a-bin
    // button under add-a-pot. Bins sit on the designed slots
    // like pots but never move. An empty bin opens the Add
    // Flower menu; a bin with a flower opens the flower's own
    // page, where clicking the flower drops one of its six
    // petals next to today's date (see the bin page below).
    // The flower types the picker offers — only the placeholder
    // until real flower artwork exists.
    const BIN_FLOWER_TYPES = [
      { id: 'placeholder', name: 'Placeholder flower', src: 'assets/bin-yellow-flower.png' },
    ];
    const BIN_PETALS = 6;

    // A spot is free for a bin when no bin is near it and no pot
    // blocks it (the bin's visible jar is 10 units wide, so its
    // detection width is 8, like the pots' shrunk sprites).
    function binSpotFree(left, row, exceptBin) {
      for (const b of bins) {
        if (b === exceptBin) continue;
        if (b.dataset.binRow === row && Math.abs(Number(b.dataset.binLeft) - left) < 8) return false;
      }
      for (const p of pots) {
        const s = getPotPos(p);
        if (s.row === row && Math.abs(s.left - left) < (6 + getPotDetectWidth(p)) / 2) return false;
      }
      return true;
    }

    // Resolve a bin drop like a pot drop: the point itself if
    // free, else the nearest free spot on the row, else null.
    function resolveBinDrop(left, row, bin) {
      const lo = Math.max(POT_MIN_LEFT, Math.min(POT_MAX_LEFT, Math.round(left)));
      if (binSpotFree(lo, row, bin)) return { left: lo, row };
      for (let d = 1; d <= POT_MAX_LEFT - POT_MIN_LEFT; d++) {
        if (lo - d >= POT_MIN_LEFT && binSpotFree(lo - d, row, bin)) return { left: lo - d, row };
        if (lo + d <= POT_MAX_LEFT && binSpotFree(lo + d, row, bin)) return { left: lo + d, row };
      }
      return null;
    }

    function getBinPos(bin) {
      return { left: Number(bin.dataset.binLeft) || 0, row: bin.dataset.binRow || 'top' };
    }

    // The bin is 48 tall where a pot is 32; its jar ink ends
    // flush with the sprite's bottom edge, so the top sits 16
    // above the row for the jar to land on the shelf line.
    function setBinPos(bin, left, row) {
      bin.dataset.binLeft = String(left);
      bin.dataset.binRow = row;
      bin.style.left = `calc(${left}px * var(--scale))`;
      bin.style.top = `calc(${SLOT_ROW_TOP[row] - 16}px * var(--scale))`;
      bin.style.zIndex = row === 'top' ? '3' : '13';
    }

    // The first free designed slot (top row left to right, then
    // the bottom row); if dragged pots block every slot, the
    // nearest free spot to the first slot, like add-a-pot.
    function findBinSpot() {
      for (const row of ['top', 'bottom']) {
        for (const left of SLOT_COL_LEFT) {
          if (binSpotFree(left, row)) return { left, row };
        }
      }
      for (const row of ['top', 'bottom']) {
        const lo = SLOT_COL_LEFT[0];
        for (let d = 0; d <= POT_MAX_LEFT - POT_MIN_LEFT; d++) {
          if (lo - d >= POT_MIN_LEFT && binSpotFree(lo - d, row)) return { left: lo - d, row };
          if (lo + d <= POT_MAX_LEFT && binSpotFree(lo + d, row)) return { left: lo + d, row };
        }
      }
      return null; // both shelves are full
    }

    // The bin's visible artwork inside its 32x48 box: the jar
    // alone is 8x13 at (12,35); a flower's stem and head rise
    // above it (9x19 at (11,29)), and once every petal has
    // been picked only the stem is left (8x16 at (12,32)).
    // Presses and clicks count only on the artwork, like the
    // pots' zones — the rest of the box is clear canvas and
    // lets whatever is beneath it (another bin's jar, a pot)
    // take the press instead.
    function binInkBox(bin) {
      if (!bin.classList.contains('has-flower')) return { x: 12, y: 35, w: 8, h: 13 };
      return bin.classList.contains('is-stem')
        ? { x: 12, y: 32, w: 8, h: 16 }
        : { x: 11, y: 29, w: 9, h: 19 };
    }

    function pointInBinInk(bin, designX, designY) {
      const pos = getBinPos(bin);
      const ink = binInkBox(bin);
      const x = designX - pos.left;
      const y = designY - (SLOT_ROW_TOP[pos.row] - 16);
      return x >= ink.x && x <= ink.x + ink.w && y >= ink.y && y <= ink.y + ink.h;
    }

    // The topmost bin whose artwork contains the client point,
    // or null. Later bins paint above earlier ones in a row.
    function binAtPoint(clientX, clientY) {
      const stageRect = stageEl.getBoundingClientRect();
      const designX = (clientX - stageRect.left) * (256 / (stageRect.width || 1));
      const designY = (clientY - stageRect.top) * (144 / (stageRect.height || 1));
      for (let i = bins.length - 1; i >= 0; i--) {
        if (pointInBinInk(bins[i], designX, designY)) return bins[i];
      }
      return null;
    }

    // What a click on a bin does: a filled bin opens its page,
    // an empty one opens the Add Flower menu.
    function openBin(bin) {
      if (bin.classList.contains('has-flower')) openBinPage(bin);
      else openFlowerModal(bin);
    }

    function createBin(left, row) {
      const bin = document.createElement('button');
      bin.classList.add('bin');
      bin.setAttribute('type', 'button');
      setBinPos(bin, left, row);
      bin.setAttribute('aria-label', 'Add a flower');
      bin.addEventListener('click', (e) => {
        if (suppressBinClick) return; // the tail of a drag, not a click
        const isKeyboard = (!e.clientX && !e.clientY); // keyboard clicks carry no point
        if (isKeyboard) { openBin(bin); return; }
        // Route the click to the bin whose artwork was actually
        // clicked, not the bin whose clear box sits on top.
        const target = binAtPoint(e.clientX, e.clientY);
        if (target) { openBin(target); return; }
        // Clear canvas over a pot: the click is the pot's.
        const pot = potAtPoint(e.clientX, e.clientY, isInPlantZone);
        if (pot) handlePotClick(pot, e);
      });
      stageEl.appendChild(bin);
      bins.push(bin);
      wireBinDrag(bin);
      return bin;
    }

    // ---------- Drag-and-drop bins (like the pots) ----------
    // Free-form drag on the shelf rows with the same rules as
    // pots: continuous horizontal position, the row snaps by
    // the bin's centre, drops resolve to the nearest free spot,
    // and the drag-to-delete X floats above the drag's starting
    // spot — dropping the bin on it deletes the bin, flower and
    // all. A bin can always be deleted (the button adds more),
    // so the marker shows for every bin drag.
    let binDragState = null;
    let suppressBinClick = false;
    let suppressBinClickTimer = 0;
    // The bins' twin of armPotClickSuppression.
    function armBinClickSuppression() {
      suppressBinClick = true;
      clearTimeout(suppressBinClickTimer);
      suppressBinClickTimer = setTimeout(() => { suppressBinClick = false; }, 300);
    }

    function binDesignDelta(e) {
      const w = binDragState.stageRect.width || 1;
      const h = binDragState.stageRect.height || 1;
      return {
        dx: (e.clientX - binDragState.startClientX) * (256 / w),
        dy: (e.clientY - binDragState.startClientY) * (144 / h),
      };
    }

    function beginBinDrag(bin, e) {
      if (dragState || binDragState) return;
      if (e.button !== undefined && e.button !== 0) return; // primary pointer only
      const stageRect = stageEl.getBoundingClientRect();
      binDragState = {
        bin,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startDesignX: (e.clientX - stageRect.left) * (256 / (stageRect.width || 1)),
        startDesignY: (e.clientY - stageRect.top) * (144 / (stageRect.height || 1)),
        moved: false,
        deleteShown: false,
        deleteArmed: false,
        origPos: getBinPos(bin),
        stageRect,
      };
      try { bin.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    }

    function moveBinDrag(e) {
      if (!binDragState) return;
      const { dx, dy } = binDesignDelta(e);
      if (!binDragState.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      const bin = binDragState.bin;
      const orig = binDragState.origPos;
      if (!binDragState.moved) {
        binDragState.moved = true;
        armBinClickSuppression();
        bin.classList.add('is-dragging');
        bin.style.zIndex = 50;
        if (deleteXEl) {
          const box = deleteXBox(orig, 1); // bins: the X floats 1 unit higher than for pots
          deleteXEl.style.left = `calc(${box.left}px * var(--scale))`;
          deleteXEl.style.top = `calc(${box.top}px * var(--scale))`;
          deleteXEl.classList.add('is-visible');
          binDragState.deleteShown = true;
        }
      }
      e.preventDefault();
      const left = Math.max(POT_MIN_LEFT, Math.min(POT_MAX_LEFT, Math.round(orig.left + dx)));
      // Row from the bin centre's Y: above the midpoint is the top shelf.
      const centreY = SLOT_ROW_TOP[orig.row] - 16 + 24 + dy;
      const row = centreY < ROW_MID_Y ? 'top' : 'bottom';
      setBinPos(bin, left, row);
      bin.style.zIndex = 50; // setBinPos restores the row z; keep the drag lift
      bin.classList.toggle('is-blocked', !binSpotFree(left, row, bin));
      // Delete arming, same as the pots: the pointer inside the
      // marker's visible X (grown by 4 units) arms the delete.
      if (binDragState.deleteShown) {
        const box = deleteXBox(orig, 5);
        const ink = (DELETE_X_SIZE - DELETE_X_INK) / 2;
        const px = binDragState.startDesignX + dx;
        const py = binDragState.startDesignY + dy;
        const armed =
          px >= box.left + ink - 4 && px <= box.left + DELETE_X_SIZE - ink + 4 &&
          py >= box.top + ink - 4 && py <= box.top + DELETE_X_SIZE - ink + 4;
        binDragState.deleteArmed = armed;
        deleteXEl.classList.toggle('is-armed', armed);
      }
    }

    function endBinDrag(cancelled, e) {
      if (!binDragState) return;
      const state = binDragState;
      binDragState = null;
      const bin = state.bin;
      // Same fast-flick case as the pots: no pointermove
      // events, but the release landed far from the press.
      if (!state.moved && !cancelled && e && typeof e.clientX === 'number' && state.stageRect) {
        const dx = (e.clientX - state.startClientX) * (256 / (state.stageRect.width || 1));
        const dy = (e.clientY - state.startClientY) * (144 / (state.stageRect.height || 1));
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) state.moved = true;
      }
      bin.classList.remove('is-dragging', 'is-blocked');
      if (deleteXEl) deleteXEl.classList.remove('is-visible', 'is-armed');
      if (cancelled || !state.moved) {
        // Plain click, or a cancelled drag: back to the origin
        // (setBinPos also restores the row z-index).
        if (state.moved) setBinPos(bin, state.origPos.left, state.origPos.row);
        return; // plain click — the click handler opens the menu/page
      }
      armBinClickSuppression();
      // The click that follows a real drag must not open anything.
      if (state.deleteArmed) {
        deleteBin(bin);
        return;
      }
      const pos = getBinPos(bin);
      const target = resolveBinDrop(pos.left, pos.row, bin);
      if (!target) {
        setBinPos(bin, state.origPos.left, state.origPos.row); // row full — snap back
        return;
      }
      setBinPos(bin, target.left, target.row);
      saveGarden();
    }

    // Removes a bin from the shelf for good, flower and all.
    // Only called from a drop on the delete marker.
    function deleteBin(bin) {
      if (pageBin === bin) pageBin = null;
      if (activeBin === bin) activeBin = null;
      removeBin(bin);
      saveGarden();
    }

    function wireBinDrag(bin) {
      bin.addEventListener('pointerdown', (e) => {
        // Only a press on a bin's artwork starts a bin drag —
        // routed to the bin whose jar is actually under the
        // pointer, which may be a different bin than the one
        // whose clear box received the press.
        const target = binAtPoint(e.clientX, e.clientY);
        if (target) { beginBinDrag(target, e); return; }
        // Clear canvas over a pot: the press is the pot's (dew
        // collection first, exactly like pressing the pot).
        const dewTarget = dewPotAtPoint(e.clientX, e.clientY);
        if (dewTarget) {
          dewSwallowPot = dewTarget;
          collectDew(dewTarget);
          return;
        }
        const pot = potAtPoint(e.clientX, e.clientY, isInDragZone);
        if (pot) beginPotDrag(pot, e);
      });
      bin.addEventListener('pointermove', (e) => {
        if (binDragState && binDragState.bin === bin) moveBinDrag(e);
      });
      bin.addEventListener('pointerup', (e) => {
        if (binDragState && binDragState.bin === bin) endBinDrag(false, e);
      });
      bin.addEventListener('pointercancel', () => {
        if (binDragState && binDragState.bin === bin) endBinDrag(true);
      });
      bin.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        // Don't hijack arrows while a modal is open.
        if (modal.classList.contains('is-open') || pdModal.classList.contains('is-open') || flowerModal.classList.contains('is-open') || binPage.classList.contains('is-open')) return;
        e.preventDefault();
        const pos = getBinPos(bin);
        const step = e.shiftKey ? 10 : 2;
        let left = pos.left;
        let row = pos.row;
        if (e.key === 'ArrowLeft') left = Math.max(POT_MIN_LEFT, pos.left - step);
        if (e.key === 'ArrowRight') left = Math.min(POT_MAX_LEFT, pos.left + step);
        if (e.key === 'ArrowUp') row = 'top';
        if (e.key === 'ArrowDown') row = 'bottom';
        if (left === pos.left && row === pos.row) return;
        if (row !== pos.row) {
          const target = resolveBinDrop(left, row, bin);
          if (!target) return;
          setBinPos(bin, target.left, target.row);
        } else {
          if (!binSpotFree(left, row, bin)) return;
          setBinPos(bin, left, row);
        }
        saveGarden();
      });
    }

    function addBin() {
      const spot = findBinSpot();
      if (!spot) return;
      createBin(spot.left, spot.row);
      saveGarden();
    }

    document.getElementById('ui-addbin')?.addEventListener('click', addBin);

    function removeBin(bin) {
      const i = bins.indexOf(bin);
      if (i >= 0) bins.splice(i, 1);
      bin.remove();
    }

    // One day's drops, kept as a list of records — one per
    // fallen petal: { t, b, note }, when the petal was picked
    // (an ISO time, or null for drops recorded before times
    // were kept), whether it was a blank drop (the flower was
    // already bare), and the note written for it in the petal
    // popup. Older saves stored per-day counts ({ n, b }); they
    // become records with no time.
    function normalizeBinDrops(drops) {
      const out = {};
      if (!drops || typeof drops !== 'object') return out;
      for (const [ds, v] of Object.entries(drops)) {
        if (Array.isArray(v)) {
          out[ds] = v.map(r => ({ t: (r && r.t) || null, b: !!(r && r.b), note: (r && r.note) || '' }));
        } else if (v && typeof v === 'object') {
          const list = [];
          for (let i = 0; i < (v.n || 0); i++) list.push({ t: null, b: false, note: '' });
          for (let i = 0; i < (v.b || 0); i++) list.push({ t: null, b: true, note: '' });
          out[ds] = list;
        }
      }
      return out;
    }

    // The flower living in a bin, read from / written to the
    // bin's dataset (and so into the garden bundle). drops maps
    // a date string to that day's list of drop records.
    function getBinFlower(bin) {
      if (!bin || !bin.classList.contains('has-flower')) return null;
      let drops = {};
      try { drops = JSON.parse(bin.dataset.drops || '{}'); } catch (e) { drops = {}; }
      drops = normalizeBinDrops(drops);
      return {
        name: bin.dataset.flowerName || '',
        type: bin.dataset.flowerType || 'placeholder',
        created: bin.dataset.flowerCreated || '',
        petalsLeft: parseInt(bin.dataset.petalsLeft, 10) || 0,
        petalsDay: bin.dataset.petalsDay || '',
        drops,
      };
    }

    function setBinFlower(bin, f) {
      if (!f) {
        bin.classList.remove('has-flower');
        bin.classList.remove('is-stem');
        delete bin.dataset.flowerName;
        delete bin.dataset.flowerType;
        delete bin.dataset.flowerCreated;
        delete bin.dataset.petalsLeft;
        delete bin.dataset.petalsDay;
        delete bin.dataset.drops;
        bin.setAttribute('aria-label', 'Add a flower');
        return;
      }
      bin.classList.add('has-flower');
      // With every petal picked, the shelf shows just the
      // stem in the jar (bin-stem.png) until the petals grow
      // back at the next day start.
      bin.classList.toggle('is-stem', (parseInt(f.petalsLeft, 10) || 0) <= 0);
      bin.dataset.flowerName = f.name;
      bin.dataset.flowerType = f.type;
      bin.dataset.flowerCreated = f.created;
      bin.dataset.petalsLeft = String(f.petalsLeft);
      if (f.petalsDay) bin.dataset.petalsDay = f.petalsDay;
      else delete bin.dataset.petalsDay;
      bin.dataset.drops = JSON.stringify(f.drops || {});
      bin.setAttribute('aria-label', `${f.name || 'Flower'} flower`);
    }

    // A new game day: every bin flower grows its petals back.
    // Each flower carries the day its petal count belongs to
    // (petalsDay — the same idea as the plants' dewDay stamp):
    // a flower stamped with an older day becomes whole again
    // and the stamp moves to today, so it happens once a day.
    // The dropped-petal history is kept.
    function resetBinPetalsForNewDay() {
      const todayStr = getLocalDateStr(getGameDate());
      let changed = false;
      bins.forEach(bin => {
        const f = getBinFlower(bin);
        if (!f || f.petalsDay === todayStr) return;
        f.petalsLeft = BIN_PETALS;
        f.petalsDay = todayStr;
        setBinFlower(bin, f);
        changed = true;
      });
      if (changed) {
        if (pageBin) renderBinPage();
        saveGarden();
      }
    }

    // ---- Add Flower menu ----
    const flowerModal = document.getElementById('add-flower-modal');
    const afTitle = document.getElementById('af-title');
    const afHowto = document.getElementById('af-howto');
    const afRemove = document.getElementById('af-remove');
    const flowerInput = document.getElementById('flower-name');
    const afCommit = document.getElementById('af-commit');
    const afTrack = document.getElementById('af-carousel-track');
    let activeBin = null;
    let selectedFlower = null;
    let flowerCarouselOffset = 0;

    // COMMIT stays greyed out until every option is chosen:
    // a flower picked from the menu and a name typed in.
    function checkFlowerCommitReady() {
      const hasName = flowerInput && flowerInput.value.trim().length > 0;
      const ready = Boolean(hasName && selectedFlower);
      if (afCommit) {
        if (ready) {
          afCommit.classList.add('is-ready');
          afCommit.removeAttribute('disabled');
        } else {
          afCommit.classList.remove('is-ready');
          afCommit.setAttribute('disabled', 'true');
        }
      }
      return ready;
    }

    function selectFlower(id) {
      selectedFlower = id;
      document.querySelectorAll('.af-flower').forEach(b => {
        b.classList.toggle('is-selected', b.dataset.flower === id);
      });
      checkFlowerCommitReady();
    }

    function updateFlowerCarousel() {
      if (afTrack) {
        afTrack.style.transform = `translateX(calc(${-flowerCarouselOffset * 36}px * var(--scale)))`;
      }
    }

    document.querySelectorAll('.af-flower').forEach(btn => {
      btn.addEventListener('click', () => selectFlower(btn.dataset.flower));
    });
    document.getElementById('af-flower-prev')?.addEventListener('click', () => {
      const count = document.querySelectorAll('.af-flower').length;
      const maxOffset = Math.max(0, count - 5);
      flowerCarouselOffset = flowerCarouselOffset > 0 ? flowerCarouselOffset - 1 : maxOffset;
      updateFlowerCarousel();
    });
    document.getElementById('af-flower-next')?.addEventListener('click', () => {
      const count = document.querySelectorAll('.af-flower').length;
      const maxOffset = Math.max(0, count - 5);
      flowerCarouselOffset = flowerCarouselOffset < maxOffset ? flowerCarouselOffset + 1 : 0;
      updateFlowerCarousel();
    });

    function openFlowerModal(bin) {
      activeBin = bin;
      const f = getBinFlower(bin);
      if (afTitle) afTitle.textContent = f ? 'Edit Flower' : 'Fix bad habits';
      if (afHowto) afHowto.textContent = 'How does this method work?';
      if (afRemove) {
        afRemove.hidden = !f;
        afRemove.classList.remove('is-confirming');
        afRemove.textContent = 'remove';
      }
      if (flowerInput) flowerInput.value = f ? f.name : '';
      flowerCarouselOffset = 0;
      updateFlowerCarousel();
      // Editing starts with the current flower picked; adding
      // starts with nothing picked, so COMMIT waits for a pick.
      selectFlower(f ? f.type : null);
      flowerModal.classList.remove('is-closing');
      flowerModal.classList.add('is-open');
      flowerModal.setAttribute('aria-hidden', 'false');
      setTimeout(() => flowerInput && flowerInput.focus(), 300);
    }

    function closeFlowerModal() {
      if (!flowerModal.classList.contains('is-open') || flowerModal.classList.contains('is-closing')) return;
      flowerModal.classList.remove('is-open');
      flowerModal.classList.add('is-closing');
      flowerModal.setAttribute('aria-hidden', 'true');
      if (afRemove) {
        afRemove.classList.remove('is-confirming');
        afRemove.textContent = 'remove';
      }
      function onAnimationEnd(e) {
        if (e.animationName === 'ap-fall-fade-out') {
          flowerModal.classList.remove('is-closing');
          flowerModal.removeEventListener('animationend', onAnimationEnd);
        }
      }
      flowerModal.addEventListener('animationend', onAnimationEnd);
    }

    document.getElementById('af-close')?.addEventListener('click', closeFlowerModal);
    flowerInput?.addEventListener('input', checkFlowerCommitReady);

    afRemove?.addEventListener('click', () => {
      if (!activeBin) return;
      if (!afRemove.classList.contains('is-confirming')) {
        afRemove.classList.add('is-confirming');
        afRemove.textContent = 'confirm';
        return;
      }
      setBinFlower(activeBin, null);
      saveGarden();
      closeFlowerModal();
    });

    afCommit?.addEventListener('click', () => {
      if (!activeBin || !checkFlowerCommitReady()) return;
      const typeData = BIN_FLOWER_TYPES.find(t => t.id === selectedFlower) || BIN_FLOWER_TYPES[0];
      const name = (flowerInput && flowerInput.value.trim()) || typeData.name;
      const existing = getBinFlower(activeBin);
      if (existing) {
        // Editing keeps the flower's history: only the name and
        // the picked flower change.
        existing.name = name;
        existing.type = selectedFlower;
        setBinFlower(activeBin, existing);
      } else {
        setBinFlower(activeBin, {
          name,
          type: selectedFlower,
          created: getLocalDateStr(getGameDate()),
          petalsLeft: BIN_PETALS,
          petalsDay: getLocalDateStr(getGameDate()),
          drops: {},
        });
      }
      saveGarden();
      closeFlowerModal();
    });

    // ---- Bin flower page ----
    const binPage = document.getElementById('bin-page-modal');
    const bhName = document.getElementById('bh-name');
    const bhDays = document.getElementById('bh-days');
    const bhRemove = document.getElementById('bh-remove');
    const bhPrev = document.getElementById('bh-page-prev');
    const bhNext = document.getElementById('bh-page-next');
    let pageBin = null;
    let binPageIndex = 0;
    let binPageCount = 1;
    let binAnimating = false;
    let bhDayNodes = [];
    const BH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function bhOrdinal(n) {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    // Lay the flower's days out into pages of two columns. Days
    // run from the creation day to today, downward in a column
    // until the month ends — a new month always starts a new
    // column — or the column fills up; two columns make a page.
    // A day's row is taller when its petals wrap to more lines.
    function binDayPages(f) {
      const todayStr = getLocalDateStr(getGameDate());
      let start = f.created || todayStr;
      if (start > todayStr) start = todayStr;
      const days = [];
      const cur = new Date(start + 'T12:00:00');
      const end = new Date(todayStr + 'T12:00:00');
      while (cur <= end) {
        const ds = getLocalDateStr(cur);
        const list = (f.drops && f.drops[ds]) || [];
        const n = list.filter(r => !r.b).length;
        const b = list.length - n;
        days.push({
          str: ds, month: cur.getMonth(), day: cur.getDate(), n, b, list,
          lines: Math.max(1, Math.ceil((n + b) / 7)),
        });
        cur.setDate(cur.getDate() + 1);
      }
      // One column per month, however long the month runs:
      // the column scrolls, and a new column starts only when
      // the month changes.
      const columns = [];
      let col = null;
      let cursorY = 43.17;
      for (const d of days) {
        const h = 10.6 + 8.4 * (d.lines - 1);
        if (!col || col.month !== d.month) {
          if (col) col.bottom = cursorY + 2;
          col = { month: d.month, days: [] };
          columns.push(col);
          cursorY = 43.17;
        }
        col.days.push({ ...d, y: cursorY });
        cursorY += h;
      }
      if (col) col.bottom = cursorY + 2;
      const pages = [];
      for (let i = 0; i < columns.length; i += 2) pages.push(columns.slice(i, i + 2));
      return pages.length ? pages : [[{ month: new Date(todayStr + 'T12:00:00').getMonth(), days: [] }]];
    }

    let bhNameMeasurer = null;
    function measureBinNameWidth(text) {
      if (!bhNameMeasurer) {
        bhNameMeasurer = document.createElement('span');
        bhNameMeasurer.className = 'ap-title bh-name-measure';
        document.body.appendChild(bhNameMeasurer);
      }
      bhNameMeasurer.textContent = text;
      return bhNameMeasurer.offsetWidth || 0;
    }

    function renderBinPage() {
      if (!pageBin) return;
      const f = getBinFlower(pageBin);
      if (!f) return;
      if (bhName) bhName.textContent = f.name || '';
      // The tall drawing (bin-flower-drawing-long) is used
      // whenever the name is short enough to end before the
      // drawing starts — 83 units, the boundary the name's
      // old split layout was tuned to. A longer name would
      // run into the tall flower, so the page falls back to
      // the shortened drawing, whose top sits below the
      // name. The modal class moves the petal overlays and
      // the click-pop centre to match the drawing shown.
      const stageRect = stageEl ? stageEl.getBoundingClientRect() : null;
      const nameScale = stageRect && stageRect.width ? stageRect.width / 256 : 1;
      const useLongDrawing = measureBinNameWidth(f.name || '') <= 83 * nameScale;
      const bhDrawing = document.getElementById('bh-drawing');
      if (bhDrawing) bhDrawing.src = useLongDrawing ? 'assets/bin-flower-drawing-long.png' : 'assets/bin-flower-drawing.png';
      if (binPage) binPage.classList.toggle('bh-long-drawing', useLongDrawing);
      // The flower keeps the petals it has not lost: petal i is
      // on the flower while i <= petalsLeft (petals fall from
      // petal6 down to petal1).
      for (let i = 1; i <= BIN_PETALS; i++) {
        const img = document.getElementById('bh-petal-' + i);
        if (!img) continue;
        if (img.getAnimations) img.getAnimations().forEach(a => a.cancel());
        img.style.display = i <= f.petalsLeft ? '' : 'none';
      }
      const pages = binDayPages(f);
      binPageCount = pages.length;
      if (binPageIndex > binPageCount - 1) binPageIndex = binPageCount - 1;
      if (binPageIndex < 0) binPageIndex = 0;
      const cols = pages[binPageIndex] || [];
      for (const node of bhDayNodes) node.remove();
      bhDayNodes = [];
      const COLS = [
        { monthX: 25.55, dayX: 32.3, petalX: 42.3, viewLeft: 30.3 },
        { monthX: 162.24, dayX: 168.24, petalX: 178.3, viewLeft: 166.24 },
      ];
      // Each month's days live in their own scroll viewport
      // under the month label: the whole month is one column,
      // and it scrolls to reach the month's end. The top of
      // the scroll matches the top of the first date (43.17):
      // the viewport starts there, and the content is measured
      // from there, so a column scrolled to its top shows its
      // first date flush with the top, just under the month
      // name.
      const COL_TOP = 43.17;
      const VIEW_TOP = 43.17;
      const todayStr = getLocalDateStr(getGameDate());
      let todayLastPetal = null;
      cols.forEach((col, ci) => {
        const C = COLS[ci];
        const m = document.createElement('p');
        m.className = 'bh-t';
        m.textContent = BH_MONTHS[col.month];
        m.style.left = `calc(${C.monthX}px * var(--scale))`;
        m.style.top = 'calc(34.77px * var(--scale))';
        bhDays.appendChild(m);
        bhDayNodes.push(m);
        const view = document.createElement('div');
        view.className = 'bh-col';
        view.style.left = `calc(${C.viewLeft}px * var(--scale))`;
        view.style.top = `calc(${VIEW_TOP}px * var(--scale))`;
        const inner = document.createElement('div');
        inner.className = 'bh-col-inner';
        inner.style.height = `calc(${(col.bottom || 42) - COL_TOP}px * var(--scale))`;
        view.appendChild(inner);
        bhDays.appendChild(view);
        bhDayNodes.push(view);
        for (const d of col.days) {
          const label = document.createElement('p');
          label.className = 'bh-t';
          label.textContent = bhOrdinal(d.day);
          label.style.left = `calc(${C.dayX - C.viewLeft}px * var(--scale))`;
          label.style.top = `calc(${d.y - COL_TOP}px * var(--scale))`;
          inner.appendChild(label);
          (d.list || []).forEach((rec, j) => {
            const img = document.createElement('img');
            img.className = 'bh-petal';
            img.src = rec.b ? 'assets/petal-icon2.png' : 'assets/petal-icon1.png';
            img.alt = '';
            img.style.left = `calc(${C.petalX + (j % 7) * 8 - C.viewLeft}px * var(--scale))`;
            img.style.top = `calc(${d.y - 4 + Math.floor(j / 7) * 8.4 - COL_TOP}px * var(--scale))`;
            // Clicking a fallen petal opens its card below
            // the petal (when it was picked, its note, an
            // undo button).
            img.addEventListener('click', () => openPetalPopup(d.str, j, img));
            inner.appendChild(img);
            if (d.str === todayStr) todayLastPetal = img;
          });
        }
        // Start at the month's end: the newest days.
        view.scrollTop = view.scrollHeight;
      });
      binPage._todayPetalEl = todayLastPetal;
      if (bhPrev) bhPrev.style.display = binPageIndex > 0 ? '' : 'none';
      if (bhNext) bhNext.style.display = binPageIndex < binPageCount - 1 ? '' : 'none';
    }

    function openBinPage(bin) {
      pageBin = bin;
      binPageIndex = 999; // opens on the last page: today's page
      if (bhRemove) {
        bhRemove.classList.remove('is-confirming');
        bhRemove.textContent = 'remove';
      }
      renderBinPage();
      binPage.classList.remove('is-closing');
      binPage.classList.add('is-open');
      binPage.setAttribute('aria-hidden', 'false');
      // The bin tutorial starts here, inside the page: on a
      // first visit, until it has been seen through — and
      // whenever "How does this method work?" armed it.
      if (!binTutorial && (binTutorialArmed || !binTutorialDone())) {
        binTutorialArmed = false;
        startBinTutorial(bin);
      }
    }

    function closeBinPage() {
      if (!binPage.classList.contains('is-open') || binPage.classList.contains('is-closing')) return;
      if (binTutorial) endBinTutorial(false);
      closePetalPopup();
      binPage.classList.remove('is-open');
      binPage.classList.add('is-closing');
      binPage.setAttribute('aria-hidden', 'true');
      if (bhRemove) {
        bhRemove.classList.remove('is-confirming');
        bhRemove.textContent = 'remove';
      }
      function onAnimationEnd(e) {
        if (e.animationName === 'ap-fall-fade-out') {
          binPage.classList.remove('is-closing');
          binPage.removeEventListener('animationend', onAnimationEnd);
        }
      }
      binPage.addEventListener('animationend', onAnimationEnd);
    }

    document.getElementById('bh-close')?.addEventListener('click', closeBinPage);
    document.getElementById('bh-edit')?.addEventListener('click', () => {
      if (!pageBin) return;
      const bin = pageBin;
      closeBinPage();
      openFlowerModal(bin);
    });
    bhRemove?.addEventListener('click', () => {
      if (!pageBin) return;
      if (!bhRemove.classList.contains('is-confirming')) {
        bhRemove.classList.add('is-confirming');
        bhRemove.textContent = 'confirm';
        return;
      }
      setBinFlower(pageBin, null);
      saveGarden();
      closeBinPage();
    });
    bhPrev?.addEventListener('click', () => {
      if (binPageIndex > 0) { binPageIndex--; renderBinPage(); }
    });
    bhNext?.addEventListener('click', () => {
      if (binPageIndex < binPageCount - 1) { binPageIndex++; renderBinPage(); }
    });
    document.getElementById('bh-centre')?.addEventListener('click', dropPetal);

    // ---- Petal popup ----
    // Clicking a fallen petal in a day column opens a small
    // card over the bin page (ui-badhabit-popup.png): when the
    // petal was picked, a notes box that saves as you type,
    // and an undo button that un-picks the petal.
    let petalPopup = null; // { date, index } into pageBin's drops

    function openPetalPopup(dateStr, index, petalEl) {
      if (!pageBin) return;
      const f = getBinFlower(pageBin);
      const rec = f && f.drops[dateStr] ? f.drops[dateStr][index] : null;
      if (!rec) return;
      petalPopup = { date: dateStr, index };
      // The card appears below the clicked petal (above it
      // when there is no room below), centred on it: the
      // whole card group shifts by the difference between
      // the petal's spot and the card's home spot.
      const shift = document.getElementById('bh-pp-shift');
      if (shift && petalEl && petalEl.getBoundingClientRect) {
        const container = binPage ? binPage.querySelector('.ap-container') : null;
        const cr = container ? container.getBoundingClientRect() : null;
        const pr = petalEl.getBoundingClientRect();
        if (cr && cr.width && pr.width) {
          // The container spans the whole stage (256 units),
          // not the 236-wide panel inside it — dividing by
          // 236 here was what pulled the card left, worse the
          // further right the petal sat.
          const scale = cr.width / 256;
          const petalX = (pr.left - cr.left) / scale;
          const petalY = (pr.top - cr.top) / scale;
          // The card ink sits at (98.49..165.49, 41..85) of
          // the container when the group is unshifted, and
          // its little arrow nub is centred at x 133.5. The
          // petal's visible centre is 8.5 into its 16-wide
          // box (the 7x7 ink at 5,4). Line the two up.
          let dx = (petalX + 8.5) - 133.5; // the arrow lands on the petal
          let dy = (petalY + 15) - 41; // card top 2 under the petal, the whole card 5 higher, then the whole popup 2 lower
          let flipped = false;
          if (85 + dy > 124) {
            // No room below: the card goes above the petal
            // and its sprite turns 180 degrees (around the
            // ink's own centre, so the card stays in its box
            // and only the arrow nub moves — to the bottom,
            // pointing down at the petal, its centre then at
            // x 130.49). Aim with that.
            flipped = true;
            dx = (petalX + 8.5) - 130.49;
            dy = (petalY - 5) - 85;
          } else {
            dx = Math.max(-96, Math.min(68, dx));
          }
          dy = Math.max(-39, Math.min(39, dy));
          const popEl = document.getElementById('bh-petal-popup');
          if (popEl) popEl.classList.toggle('is-flipped', flipped);
          shift.style.left = `calc(${dx}px * var(--scale))`;
          shift.style.top = `calc(${dy}px * var(--scale))`;
        }
      }
      const timeEl = document.getElementById('bh-pp-time');
      if (timeEl) {
        const parts = dateStr.split('-').map(Number);
        const when = `${BH_MONTHS[parts[1] - 1]} ${parts[2]}`;
        if (rec.t) {
          const t = new Date(rec.t);
          const hh = String(t.getHours()).padStart(2, '0');
          const mi = String(t.getMinutes()).padStart(2, '0');
          timeEl.textContent = dateStr === getLocalDateStr(getGameDate())
            ? `picked at ${hh}:${mi}`
            : `picked at ${hh}:${mi} on ${when}`;
        } else {
          // Drops recorded before times were kept.
          timeEl.textContent = `picked on ${when}`;
        }
      }
      const notesEl = document.getElementById('bh-pp-notes');
      if (notesEl) { notesEl.value = rec.note || ''; fitNotesHeight(); }
      const pop = document.getElementById('bh-petal-popup');
      if (pop) pop.hidden = false;
    }

    // The notes field wraps onto new lines instead of
    // scrolling sideways, growing taller as the note wraps —
    // but only within the room inside the card (26 units
    // below the notes line): a note that would outgrow the
    // card is refused at the keyboard (see the input
    // listener), so the field never needs to scroll.
    function notesMaxHeight() {
      const scale = stageEl ? (stageEl.getBoundingClientRect().width || 256) / 256 : 1;
      return 26 * scale;
    }

    function fitNotesHeight() {
      const notesEl = document.getElementById('bh-pp-notes');
      if (!notesEl || !notesEl.scrollHeight) return;
      notesEl.style.height = 'auto';
      notesEl.style.height = Math.min(notesEl.scrollHeight, notesMaxHeight()) + 'px';
    }

    function closePetalPopup() {
      petalPopup = null;
      const pop = document.getElementById('bh-petal-popup');
      if (pop) pop.hidden = true;
    }

    function undoPetalPick() {
      if (!pageBin || !petalPopup) return;
      const f = getBinFlower(pageBin);
      if (!f) return;
      const list = f.drops[petalPopup.date];
      const rec = list ? list[petalPopup.index] : null;
      if (!rec) { closePetalPopup(); return; }
      list.splice(petalPopup.index, 1);
      if (!list.length) delete f.drops[petalPopup.date];
      // Un-picking one of today's petals puts it back on the
      // flower; an older day's petals already grew back at
      // that day's end, so only the record goes there.
      if (!rec.b && petalPopup.date === getLocalDateStr(getGameDate()) && f.petalsLeft < BIN_PETALS) {
        f.petalsLeft += 1;
      }
      setBinFlower(pageBin, f);
      saveGarden();
      closePetalPopup();
      renderBinPage();
    }

    document.getElementById('bh-pp-close')?.addEventListener('click', closePetalPopup);
    document.getElementById('bh-pp-undo')?.addEventListener('click', undoPetalPick);
    document.getElementById('bh-pp-notes')?.addEventListener('input', () => {
      if (!pageBin || !petalPopup) return;
      const f = getBinFlower(pageBin);
      const rec = f && f.drops[petalPopup.date] ? f.drops[petalPopup.date][petalPopup.index] : null;
      if (!rec) return;
      const notesEl = document.getElementById('bh-pp-notes');
      if (!notesEl) return;
      // Too long for the card? The input is refused — the
      // field keeps the last note that fit, so typing simply
      // stops having an effect at the limit.
      notesEl.style.height = 'auto';
      if (notesEl.scrollHeight && notesEl.scrollHeight > notesMaxHeight()) {
        notesEl.value = rec.note || '';
        fitNotesHeight();
        return;
      }
      rec.note = notesEl.value;
      setBinFlower(pageBin, f);
      saveGarden();
      fitNotesHeight();
    });
    document.getElementById('bh-petal-popup')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget || (e.target && e.target.classList && e.target.classList.contains('bh-popup-card'))) closePetalPopup();
    });

    // Run one WAAPI animation and wait for it; without WAAPI
    // (or if it fails) the end state simply applies at once.
    function animateOnce(el, keyframes, options) {
      if (!el || typeof el.animate !== 'function') return Promise.resolve();
      try {
        const a = el.animate(keyframes, options);
        return a && a.finished ? a.finished.catch(() => { }) : Promise.resolve();
      } catch (e) { return Promise.resolve(); }
    }

    // Clicking the jar squeezes the flower drawing smaller:
    // scale down to 0.95, dipping 20% into the 420ms, back
    // to rest by the end.
    // Fired before the petal-removal animation, which replaces
    // the transform on the one petal layer that is leaving.
    function bounceBinFlower() {
      binPage.querySelectorAll('.bh-layer').forEach((el) => {
        if (!el || typeof el.animate !== 'function') return;
        try {
          el.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.95)', offset: 0.2 },
            { transform: 'scale(1)' },
          ], { duration: 420, easing: 'ease' });
        } catch (e) { /* the pop is decoration only */ }
      });
    }

    // Clicking the flower: one petal lifts off the flower and
    // fades away, then a petal falls in next to today's date.
    // Once all six petals are gone, the petal that falls in is
    // a blank one (just the outline).
    function dropPetal() {
      if (!pageBin || binAnimating) return;
      const f = getBinFlower(pageBin);
      if (!f) return;
      const todayStr = getLocalDateStr(getGameDate());
      const isNormal = f.petalsLeft > 0;
      const overlay = isNormal ? document.getElementById('bh-petal-' + f.petalsLeft) : null;
      if (isNormal) f.petalsLeft -= 1;
      const dropList = f.drops[todayStr] || (f.drops[todayStr] = []);
      dropList.push({ t: new Date().toISOString(), b: !isNormal, note: '' });
      setBinFlower(pageBin, f);
      saveGarden();
      // The bin tutorial's click-the-flower step listens for a
      // real drop on its bin: the drop is the lesson's
      // demonstration and advances that step. endBinTutorial
      // takes the drop back, so it leaves no fake history.
      if (binTutorial && pageBin === binTutorial.bin && !binTutorial.drop) {
        binTutorial.drop = { date: todayStr, index: dropList.length - 1, blank: !isNormal };
        if (binTutorial.step === 1) advanceBinTutorial();
      }
      binAnimating = true;
      bounceBinFlower();
      const scale = (stageEl.getBoundingClientRect().width || 256) / 256;
      (async () => {
        if (overlay) {
          // The petal rises off the flower, speeding up as it
          // goes (ease-in), reaching the top at 464ms (the old
          // 650ms rise at 1.4x speed). The fade starts at once
          // and is complete by 300ms (offset 0.647 of 464).
          await animateOnce(overlay, [
            { transform: 'translateY(0px)', opacity: 1, offset: 0 },
            { opacity: 0, offset: 0.647 },
            { transform: `translateY(${-18 * scale}px)`, opacity: 0, offset: 1 },
          ], { duration: 464, easing: 'cubic-bezier(0.42, 0, 1, 1)', fill: 'forwards' });
        }
        binPageIndex = 999; // the petal lands on today's page
        renderBinPage();
        const target = binPage._todayPetalEl;
        if (target) {
          // The petal falls in next to today's date: fastest
          // at the start, slowing down until it rests.
          await animateOnce(target, [
            { transform: `translateY(${-12 * scale}px)`, opacity: 0 },
            { transform: 'translateY(0px)', opacity: 1 },
          ], { duration: 550, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        }
        binAnimating = false;
      })();
    }

    // ---- Bin tutorial ----
    // The bad-habit method, taught inside the bin page in the
    // garden tutorial's own style: a bobbing hint line and the
    // little down arrow over the top of the panel. It starts
    // when the bin page opens — on a first visit, until it has
    // been seen through (hg.binTutorialDone.v1), and whenever
    // the Add Flower page's "How does this method work?" text
    // armed it. Most steps advance on a click anywhere in the
    // page; the second waits for a real click on the flower,
    // and the petal step opens the petal popup as its
    // demonstration.
    const BIN_TUTORIAL_KEY = 'hg.binTutorialDone.v1';
    const BIN_TUTORIAL_STEPS = [
      'Here’s how this method works (click to continue)',
      'Whenever you act on a bad habit, come to your garden and click the flower.',
      'You don’t have to stop yourself from doing your bad habit. You can do your bad habit however long and often as you please.',
      'Just come to your garden and report it. Raising awareness is the goal.',
      'The petals will keep track of your actions.',
      'If you can keep this up for a week, you will build a habit of reporting your habits.',
      'And once this new habit is internalized, it will override your old habit, effectively removing it.',
      'This is called habit replacement.',
      'Let’s try to keep this up for a week!',
    ];
    let binTutorial = null; // { bin, step, drop: {date, index, blank} | null }
    let binTutorialArmed = false;
    const bhTut = document.getElementById('bh-tut');
    const bhHint = document.getElementById('bh-hint');
    const bhHintArrow = document.getElementById('bh-hint-arrow');
    const bhTutCreate = document.getElementById('bh-tut-create');

    function binTutorialDone() {
      return !!lsGet(BIN_TUTORIAL_KEY);
    }

    function startBinTutorial(bin) {
      if (!bhTut || binTutorial) return;
      binTutorial = { bin: bin || pageBin, step: 0, drop: null };
      bhTut.hidden = false;
      showBinTutorialStep();
    }

    function showBinTutorialStep() {
      if (!binTutorial) return;
      const step = binTutorial.step;
      const last = BIN_TUTORIAL_STEPS.length - 1;
      if (bhHint) bhHint.textContent = BIN_TUTORIAL_STEPS[step];
      if (bhTutCreate) bhTutCreate.hidden = step !== last;
      // The arrow only appears on the two steps that point
      // at something: the flower (step 2) and the petal
      // popup (step 5).
      if (bhHintArrow) bhHintArrow.hidden = !(step === 1 || step === 4);
      // The petal step's line moves low, below the popup;
      // every other step keeps the right-side spot.
      if (bhTut) {
        bhTut.classList.toggle('is-low', step === 4);
        if (step !== 4) bhTut.style.top = '';
      }
      if (step === last) {
        // Reaching the last step counts as having seen the
        // tutorial: it never auto-starts again after this.
        lsSet(BIN_TUTORIAL_KEY, '1');
      }
      if (step === 4) showBinTutorialPetalPopup();
    }

    function advanceBinTutorial() {
      if (!binTutorial) return;
      if (binTutorial.step >= BIN_TUTORIAL_STEPS.length - 1) return;
      // Leaving the petal step puts its popup demonstration away.
      if (binTutorial.step === 4) closePetalPopup();
      binTutorial.step += 1;
      showBinTutorialStep();
    }

    // The petal step's demonstration: open the petal popup on
    // a real petal of the tutorial's flower — the tutorial's
    // own drop if it made one, else the latest recorded petal,
    // else a fresh drop (taken back when the tutorial ends).
    function showBinTutorialPetalPopup() {
      if (!binTutorial || !pageBin) return;
      const f = getBinFlower(pageBin);
      if (!f) return;
      let target = binTutorial.drop;
      if (!target) {
        const days = Object.keys(f.drops).filter(d => f.drops[d] && f.drops[d].length).sort();
        if (days.length) {
          const d = days[days.length - 1];
          target = { date: d, index: f.drops[d].length - 1 };
        }
      }
      if (!target) {
        dropPetal();
        target = binTutorial.drop;
        if (!target) return;
        // The drop re-renders the page as its animation lands;
        // open the popup on the new petal icon once it exists.
        setTimeout(() => {
          if (binTutorial) {
            openPetalPopup(target.date, target.index, binPage._todayPetalEl || null);
            placeBinTutorialHintBelowPopup();
          }
        }, 1200);
        return;
      }
      const todayStr = getLocalDateStr(getGameDate());
      openPetalPopup(target.date, target.index,
        target.date === todayStr ? (binPage._todayPetalEl || null) : (document.getElementById('bh-centre') || null));
      placeBinTutorialHintBelowPopup();
    }

    // The petal step's line belongs below the petal popup,
    // its arrow pointing up at the card: when the popup was
    // positioned on a real petal, the line goes just under
    // the card's ink — the ink's bottom edge sits at 85 in
    // container units before the popup's own shift is added —
    // then nudged by eye, matching the block's leftward
    // shift in the stylesheet.
    function placeBinTutorialHintBelowPopup() {
      if (!bhTut) return;
      const shift = document.getElementById('bh-pp-shift');
      const m = shift && shift.style && typeof shift.style.top === 'string'
        ? shift.style.top.match(/calc\((-?[\d.]+)px/) : null;
      if (!m) return; // the stylesheet's low spot is the fallback
      const top = Math.min(85 + parseFloat(m[1]) - 3, 105);
      bhTut.style.top = `calc(${top}px * var(--scale))`;
    }

    function endBinTutorial(createPlant) {
      if (!binTutorial) return;
      const tut = binTutorial;
      binTutorial = null;
      binTutorialArmed = false;
      if (bhTut) {
        bhTut.hidden = true;
        bhTut.classList.remove('is-low');
        bhTut.style.top = '';
      }
      closePetalPopup();
      // Take back the tutorial's own drop, if it made one:
      // the petal goes back on the flower and the record
      // goes, so the lesson leaves no fake history behind.
      if (tut.drop && tut.bin) {
        const f = getBinFlower(tut.bin);
        if (f) {
          const list = f.drops[tut.drop.date];
          if (list && list[tut.drop.index]) {
            const rec = list[tut.drop.index];
            list.splice(tut.drop.index, 1);
            if (!list.length) delete f.drops[tut.drop.date];
            if (!rec.b && f.petalsLeft < BIN_PETALS) f.petalsLeft += 1;
            setBinFlower(tut.bin, f);
            saveGarden();
            if (pageBin === tut.bin && binPage.classList.contains('is-open')) renderBinPage();
          }
        }
      }
      if (createPlant) {
        if (binPage.classList.contains('is-open')) closeBinPage();
        const before = pots.length;
        addPot();
        if (pots.length > before) {
          openModal(pots[pots.length - 1], false);
          // The companion good habit, filled in and set to a
          // weekly Sunday repeat: pick a plant and commit.
          if (plantInput) plantInput.value = 'review my bad habits';
          repeatIndex = repeatOptions.indexOf('weekly');
          updateRepeat();
          dayBtns.forEach(btn => {
            const on = btn.textContent.trim() === 'sun';
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          checkCommitReady();
        }
      }
    }

    // While the tutorial runs, the page's clicks are the
    // lesson's "continue": they are held back from the page
    // and advance the step — except the flower click on its
    // own step (dropPetal advances it), the close button, and
    // the create-plant text, which keep their own jobs.
    binPage.addEventListener('click', (e) => {
      if (!binTutorial) return;
      const t = e.target;
      if (t && t.closest && t.closest('#bh-tut-create, #bh-close')) return;
      if (binTutorial.step === 1) {
        if (t && t.closest && t.closest('#bh-centre')) return;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      // On the last step, a click anywhere but create plant
      // simply ends the tutorial.
      if (binTutorial.step >= BIN_TUTORIAL_STEPS.length - 1) {
        endBinTutorial(false);
        return;
      }
      advanceBinTutorial();
    }, true);
    bhTutCreate?.addEventListener('click', (e) => {
      e.stopPropagation();
      endBinTutorial(true);
    });

    // "How does this method work?" on the Add Flower page:
    // an empty bin gets a flower called "example" on the
    // spot, so the tutorial has a flower to teach on, and the
    // tutorial starts right away in the bin page. (A bin that
    // already has its flower keeps it — no example is made.)
    afHowto?.addEventListener('click', () => {
      const bin = activeBin;
      if (!bin) return;
      if (!getBinFlower(bin)) {
        setBinFlower(bin, {
          name: 'example',
          type: 'placeholder',
          created: getLocalDateStr(getGameDate()),
          petalsLeft: BIN_PETALS,
          petalsDay: getLocalDateStr(getGameDate()),
          drops: {},
        });
        saveGarden();
      }
      binTutorialArmed = true;
      closeFlowerModal();
      openBinPage(bin);
    });

    // ---- Sign-in page ----
    const signInModal = document.getElementById('signin-modal');
    const siForm = document.getElementById('si-form');
    const siAccount = document.getElementById('si-account');
    const siStatus = document.getElementById('si-status');
    const siAccountEmail = document.getElementById('si-account-email');
    const signInText = document.getElementById('ui-signin');

    function setSiStatus(msg, isError) {
      if (!siStatus) return;
      siStatus.textContent = msg || '';
      siStatus.classList.toggle('is-error', !!isError);
    }

    // The "signed in as …" text scrolls back into the account pill
    // 3 seconds after it appears (signing in, or a visit that
    // restores the session) and stays there — hovering the pill
    // does not bring it back (Shusuke's call); the pill itself is
    // the way back into the account panel. The signed-out invite
    // never scrolls away — it is the way in.
    let signInHideTimer = null;
    function scheduleSignInTextHide(delayMs) {
      if (signInHideTimer) { clearTimeout(signInHideTimer); signInHideTimer = null; }
      // The signed-in note stays out for 3s; the signed-out
      // "already have a garden?" question stays out for 4s.
      // Then either one scrolls back into the pill.
      const delay = delayMs !== undefined ? delayMs : (signedInEmail ? 3000 : 4000);
      const email = signedInEmail;
      signInHideTimer = setTimeout(() => {
        if (!signInText || signedInEmail !== email) return;
        const wasQuestion = signInText.textContent === 'already have a garden?';
        signInText.classList.add('is-out');
        // A signed-out visitor who finished the tutorial on
        // an earlier visit gets the second message right
        // after the question: "sign in to save your plants".
        if (wasQuestion && !email) {
          setTimeout(() => maybeShowSaveNote(), 850);
        }
      }, delay);
    }

    // Bring the corner text out of the pill and start its
    // scroll back in (3s later when signed in, 4s when signed
    // out). Only called when the sign-in state itself changes
    // — signing in, creating an account, signing out, a visit
    // that restores the session, or a page opened signed out.
    // Just opening the panel (the pill press) must NOT bring the
    // text out, so openSignInModal does not call this.
    function showSignInText(delayMs) {
      if (signInText) signInText.classList.remove('is-out');
      scheduleSignInTextHide(delayMs);
    }

    // The second signed-out message: after the tutorial is
    // finished, "sign in to save your plants" slides out of
    // the pill and scrolls back in after 3s. It shows once
    // per page load — when the tutorial is finished during
    // the visit (updateHint calls window.hgOnTutorialDone),
    // or, for a visitor who finished it on an earlier visit,
    // right after the opening question (the chain in
    // scheduleSignInTextHide above).
    let saveNoteShown = false;
    function maybeShowSaveNote() {
      if (saveNoteShown || signedInEmail || !signInText) return;
      if (!hasMovedFirstPot) return; // the tutorial is not finished yet
      saveNoteShown = true;
      signInText.textContent = 'sign in to save your plants';
      signInText.classList.add('is-visible');
      showSignInText(3000);
    }
    window.hgOnTutorialDone = maybeShowSaveNote;

    function refreshSignInUI() {
      if (signInText) {
        signInText.textContent = signedInEmail ? `signed in as ${signedInEmail}` : 'already have a garden?';
      }
      if (siForm) siForm.hidden = !!signedInEmail;
      if (siAccount) siAccount.hidden = !signedInEmail;
      if (siAccountEmail) siAccountEmail.textContent = signedInEmail || '';
    }

    function openSignInModal() {
      if (!signInModal) return;
      refreshSignInUI();
      setSiStatus('');
      signInModal.classList.remove('is-closing');
      signInModal.classList.add('is-open');
      signInModal.setAttribute('aria-hidden', 'false');
    }

    function closeSignInModal() {
      if (!signInModal || !signInModal.classList.contains('is-open') || signInModal.classList.contains('is-closing')) return;
      signInModal.classList.remove('is-open');
      signInModal.classList.add('is-closing');
      signInModal.setAttribute('aria-hidden', 'true');
      function onAnimationEnd(e) {
        if (e.animationName === 'ap-fall-fade-out') {
          signInModal.classList.remove('is-closing');
          signInModal.removeEventListener('animationend', onAnimationEnd);
        }
      }
      signInModal.addEventListener('animationend', onAnimationEnd);
    }

    // ---- The cloud hook ----
    // The Firebase bridge (the module script at the end of the
    // page) reports sign-ins here. This is the one place a
    // signed-in state begins: it fetches the account's garden row
    // from the cloud and puts it on the shelf.
    let cloudUid = null;
    window.hgCloudStatus = function (msg, isError) { setSiStatus(msg, isError); };
    window.hgCloudHook = function (user) {
      if (!user) {
        // Signed out (or no session): only the in-memory state
        // clears. The sign-out BUTTON does the page reset itself.
        if (cloudUid) {
          cloudUid = null;
          signedInEmail = null;
          refreshSignInUI();
        } else {
          // No session behind the remembered account after all
          // (it expired or was revoked): forget the account on
          // record, so the next visit counts as signed out and
          // gets the tutorial.
          ssRemove(CLOUD_EMAIL_KEY);
          refreshSignInUI();
        }
        // A signed-out visitor gets the "already have a
        // garden?" text sliding out of the account pill as
        // the page opens; it scrolls back in after 4s.
        if (signInText) signInText.classList.add('is-visible');
        showSignInText();
        return;
      }
      if (cloudUid === user.uid) return; // already applied
      // A DIFFERENT account than the one already applied in
      // this page session (a switch — possible when another
      // tab changes the sign-in): the shelf may still hold the
      // previous account's garden, so it must never be adopted
      // into the new account below.
      const switchedAccount = !!cloudUid;
      // The shelf may be showing the LAST garden visited in
      // this browser, which can belong to a different account:
      // that garden is foreign here and, like a switched
      // account's, is never adopted into this one.
      const shelfIsForeign = typeof shelfGardenOwner === 'string' && shelfGardenOwner !== user.email;
      const myUid = user.uid;
      cloudUid = user.uid;
      signedInEmail = user.email;
      ssSet(CLOUD_EMAIL_KEY, user.email);
      // The tutorial flag counts now that sign-in is confirmed:
      // a user who finished the tutorial on this browser before
      // never sees it again.
      if (!hasMovedFirstPot && lsGet('hg.tutorialDone.v1')) {
        hasPlantedFirstPlant = true;
        hasWateredFirstPlant = true;
        hasMovedFirstPot = true;
        updateHint();
      }
      const bridge = window.hgCloud;
      Promise.resolve(bridge && bridge.load ? bridge.load() : null).then(cloudGarden => {
        // A newer sign-in (or a sign-out) superseded this one
        // while the garden was loading: do not apply it.
        if (cloudUid !== myUid) return;
        if (cloudGarden && Array.isArray(cloudGarden) && cloudGarden.length) {
          // The account's garden, from the cloud: it wins over
          // whatever is on the shelf right now.
          restoreGarden(cloudGarden);
          lsSet(GARDEN_KEY_PREFIX + signedInEmail, serializeGarden());
        } else if (switchedAccount || shelfIsForeign) {
          // ACCOUNT SWITCH: the account has no cloud garden,
          // and the shelf may be the PREVIOUS account's garden —
          // it is never adopted. The new account starts from
          // its own mirrored garden if this browser has one,
          // and from a fresh shelf otherwise.
          const own = lsGet(GARDEN_KEY_PREFIX + signedInEmail);
          if (Array.isArray(own) && own.some(e => e && e.plant)) {
            restoreGarden(own);
            const bundle = serializeGarden();
            lsSet(GARDEN_KEY_PREFIX + signedInEmail, bundle);
            lastSavedBundleJson = bundleJson(bundle);
            if (bridge && bridge.save) { try { bridge.save(bundle); } catch (e) { } }
          } else {
            restoreGarden([{ left: SLOT_COL_LEFT[0], row: 'top', homeLeft: String(SLOT_COL_LEFT[0]), homeRow: 'top', potType: null, plant: null }]);
            lastSavedBundleJson = bundleJson(serializeGarden());
          }
        } else {
          // ADOPTION: the account has no garden in the cloud yet,
          // so the garden already here becomes its first one —
          // the shelf as it stands, or (if the shelf is empty)
          // this account's OWN garden mirrored in this browser
          // (saved under the old browser-only accounts with the
          // same email). Another account's garden is never
          // adopted. Nothing is lost by signing in.
          let bundle = serializeGarden();
          if (!bundle.some(e => e && e.plant)) {
            const own = lsGet(GARDEN_KEY_PREFIX + signedInEmail);
            if (Array.isArray(own) && own.some(e => e && e.plant)) {
              restoreGarden(own);
              bundle = serializeGarden();
            }
          }
          lsSet(GARDEN_KEY_PREFIX + signedInEmail, bundle);
          lastSavedBundleJson = bundleJson(bundle);
          if (bridge && bridge.save) { try { bridge.save(bundle); } catch (e) { } }
        }
        // The shelf now holds this account's garden: it is
        // also the last garden this browser has visited.
        shelfGardenOwner = signedInEmail;
        lsSet(LAST_GARDEN_KEY, { email: signedInEmail, bundle: serializeGarden() });
        // Today's drops are now decided from this account's
        // garden as it was saved before — not the guest shelf's.
        resetDewGrant();
        updateDewDrops();
        refreshSignInUI();
        showSignInText();
      }).catch(() => {
        if (cloudUid !== myUid) return;
        // The cloud could not be reached: stay signed in locally
        // with this account's OWN mirrored garden, if this
        // browser has one — never another account's.
        const local = lsGet(GARDEN_KEY_PREFIX + signedInEmail);
        if (local) restoreGarden(local);
        else if (shelfIsForeign) {
          // No mirror of this account's here and the shelf is
          // another account's garden: start this account from
          // a fresh shelf rather than show (and later save)
          // a garden that is not its own.
          restoreGarden([{ left: SLOT_COL_LEFT[0], row: 'top', homeLeft: String(SLOT_COL_LEFT[0]), homeRow: 'top', potType: null, plant: null }]);
        }
        if (local || shelfIsForeign) {
          shelfGardenOwner = signedInEmail;
          lsSet(LAST_GARDEN_KEY, { email: signedInEmail, bundle: serializeGarden() });
        }
        refreshSignInUI();
        showSignInText();
      });
    };

    // ---- Live sync between devices ----
    // The bridge watches the account's cloud row. When another
    // device changes it — collecting dew there, say — the new
    // garden arrives here and goes on the shelf, so every
    // device shows the same garden. Our own saves echo back
    // too; those are recognised (the bundle matches the last
    // one we sent) and ignored. If a pot is mid-drag when a
    // change arrives, it waits until the drag ends.
    let pendingRemoteGarden = null;
    window.hgRemoteGarden = function (bundle, uid) {
      // A bundle tagged with a different account than the one
      // applied here is not ours to show (an account switch in
      // another tab can race the watch over).
      if (uid && cloudUid && uid !== cloudUid) return;
      if (!signedInEmail || !Array.isArray(bundle) || !bundle.length) return;
      if (bundleJson(bundle) === lastSavedBundleJson) return; // our own echo
      pendingRemoteGarden = bundle;
      applyPendingRemoteGarden();
    };
    function applyPendingRemoteGarden() {
      if (!pendingRemoteGarden) return;
      if (dragState) { setTimeout(applyPendingRemoteGarden, 1200); return; }
      const bundle = pendingRemoteGarden;
      pendingRemoteGarden = null;
      lastSavedBundleJson = bundleJson(bundle);
      restoreGarden(bundle);
      lsSet(GARDEN_KEY_PREFIX + signedInEmail, serializeGarden());
      shelfGardenOwner = signedInEmail;
      lsSet(LAST_GARDEN_KEY, { email: signedInEmail, bundle: serializeGarden() });
      resetDewGrant();
      updateDewDrops();
    }

    function handleGoogleSignIn() {
      if (window.hgCloud && window.hgCloud.signIn) {
        setSiStatus('opening Google sign-in…');
        try { window.hgCloud.signIn(); } catch (e) { setSiStatus('sign-in could not start — please try again', true); }
      } else {
        setSiStatus('the sign-in service is still loading — give it a moment and try again', true);
      }
    }

    function handleSignOut() {
      if (window.hgCloud && window.hgCloud.signOut) {
        try { window.hgCloud.signOut(); } catch (e) { }
      }
      cloudUid = null;
      signedInEmail = null;
      ssRemove(CLOUD_EMAIL_KEY);
      // Signing out resets the page: the reload brings back the
      // fresh signed-out state (one empty pot, the intro hint, the
      // corner pills hidden again). The account's saved garden is
      // NOT deleted — signing back in restores it.
      window.location.reload();
    }

    document.getElementById('ui-signin')?.addEventListener('click', openSignInModal);
    document.getElementById('ui-account')?.addEventListener('click', openSignInModal);
    document.getElementById('si-close')?.addEventListener('click', closeSignInModal);
    signInModal?.addEventListener('click', (e) => {
      if (e.target === signInModal) closeSignInModal();
    });
    document.getElementById('si-google')?.addEventListener('click', handleGoogleSignIn);
    document.getElementById('si-signout')?.addEventListener('click', handleSignOut);

    // A returning visit opens with the LAST garden that was
    // on this shelf — signed in or out, it is kept in the
    // browser, with the email of the account it belongs to
    // (null for a signed-out garden). Firebase then restores
    // the session by itself and reports in through the cloud
    // hook, which puts the signed-in account's own garden
    // back over it; the remembered owner keeps that hook from
    // ever adopting a different account's garden into the
    // one signing in.
    const lastGarden = lsGet(LAST_GARDEN_KEY);
    // A signed-out tab only ever reopens a signed-out garden:
    // a garden that belongs to an account is never adopted by
    // the signed-out shelf — most sharply right after signing
    // out, when the reload must come back to a fresh shelf. A
    // tab with a session on record may reopen its own
    // account's garden; the cloud hook reconciles it when it
    // reports in.
    const sessionEmail = ssGet('hg.cloudEmail.v1');
    if (lastGarden && Array.isArray(lastGarden.bundle) && lastGarden.bundle.length
      && (!lastGarden.email || lastGarden.email === sessionEmail)) {
      shelfGardenOwner = lastGarden.email || null;
      restoreGarden(lastGarden.bundle);
      if (lastGarden.bundle.some(e => e && e.plant)) {
        // A garden with plants is not a new garden: the intro
        // is skipped for this visit and the corner buttons
        // show, as if it had just been played here.
        hasPlantedFirstPlant = true;
        hasWateredFirstPlant = true;
        hasMovedFirstPot = true;
        updateHint();
      }
    }
    refreshSignInUI();

    updateDewDrops();

    function openPlantDetailsModal(pot) {
      currentDetailsPot = pot;

      const cfg = getPopupConfig(pot);

      pdBg.src = cfg.bg;
      let transforms = [];
      if (cfg.flipX) transforms.push('scaleX(-1)');
      if (cfg.flipY) transforms.push('scaleY(-1)');
      pdBg.style.transform = transforms.length ? transforms.join(' ') : 'none';

      pdDialog.style.left = `calc(${cfg.left}px * var(--scale))`;
      pdDialog.style.top = `calc(${cfg.top}px * var(--scale))`;
      pdContent.style.transform = cfg.flipY ? 'translateY(calc(-20px * var(--scale)))' : 'none';

      pdRepeat.textContent = pot.dataset.repeat || 'daily';

      const todayStr = getGameDayStr();
      if (pot.dataset.lastWateredDate && pot.dataset.lastWateredDate !== todayStr) {
        pot.dataset.wateredToday = 'false';
      }

      const isWatered = pot.dataset.wateredToday === 'true';
      pdWater.classList.toggle('is-watered', isWatered);

      // Render 8 streak opportunities
      const streakData = calculateStreak(pot);
      pot.dataset.streak = JSON.stringify(streakData);
      updatePotVisuals(pot);

      const plantName = pot.dataset.plantName || 'Plant Name';
      const isDead = pot.dataset.plantState === 'dead';
      const isBud = pot.dataset.stage !== 'grown';

      pdTitle.textContent = '';
      const titleLine = document.createElement('span');
      titleLine.className = 'pd-title-line';
      titleLine.appendChild(document.createTextNode(plantName));
      if (isDead) {
        const span = document.createElement('span');
        span.className = 'pd-title-status pd-title-status--dead';
        span.textContent = '(dead)';
        titleLine.appendChild(span);
      } else if (isBud) {
        const span = document.createElement('span');
        span.className = 'pd-title-status pd-title-status--bud';
        span.textContent = '(bud)';
        titleLine.appendChild(span);
      }
      pdTitle.appendChild(titleLine);

      // A name too long for the popup is scrolled by hand
      // (drag it, or wheel over it — wired up with the popup's
      // elements below); each plant's name starts at its start.
      pdTitle.scrollLeft = 0;

      pdStreak.innerHTML = '';
      for (let i = 0; i < 8; i++) {
        const li = document.createElement('li');
        li.className = `pd-streak-day pd-streak-day--${i + 1}`;
        const val = streakData[i] || '-';
        let iconSrc = 'assets/ui-strek-blank.png';
        let alt = 'n/a';
        if (val === 'check') {
          iconSrc = 'assets/ui-strek-check.png';
          alt = 'watered';
        } else if (val === 'x') {
          iconSrc = 'assets/ui-strek-x.png';
          alt = 'not watered';
        }
        li.innerHTML = `<img src="${iconSrc}" alt="${alt}">`;
        pdStreak.appendChild(li);
      }

      // The small text above the streak bar always says "today".
      // (streakLastOppLabel itself still records what the bar's
      // last slot really is — the missed-watering count reads it —
      // only the displayed text is fixed.)
      const pdToday = document.querySelector('.pd-today');
      if (pdToday) {
        pdToday.textContent = 'today';
      }

      pdModal.classList.add('is-open');
      pdModal.setAttribute('aria-hidden', 'false');
    }

    function closePlantDetailsModal() {
      if (!pdModal.classList.contains('is-open')) return;
      pdModal.classList.remove('is-open');
      pdModal.setAttribute('aria-hidden', 'true');

      // Reset remove button confirm state
      if (pdRemove) {
        pdRemove.classList.remove('is-confirming');
        pdRemove.textContent = 'remove';
      }
    }

    function playWateringAnimation(pot) {
      const anim = document.createElement('div');
      anim.className = 'watering-anim';
      const dropCount = 13; // 8 + 5 more drops = 13
      for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('span');
        drop.className = 'water-drop';
        drop.style.left = `${5 + Math.random() * 90}%`;
        drop.style.animationDelay = `${Math.random() * 0.55}s`;
        anim.appendChild(drop);
      }
      pot.appendChild(anim);

      setTimeout(() => anim.remove(), 1400);
    }

    function playSparkleAnimation(pot) {
      const anim = document.createElement('div');
      anim.className = 'sparkle-anim';

      const isBud = pot.dataset.stage === 'bud';
      const yBase = isBud ? 4 : -6;
      const ySpan = isBud ? 14 : 24;

      const sparkleDefs = [
        { type: 1, x: 8, y: yBase },
        { type: 2, x: 16, y: yBase - 4 },
        { type: 1, x: 24, y: yBase + 2 },
        { type: 2, x: 5, y: yBase + ySpan * 0.38 },
        { type: 1, x: 16, y: yBase + ySpan * 0.45 },
        { type: 2, x: 27, y: yBase + ySpan * 0.4 },
        { type: 1, x: 10, y: yBase + ySpan * 0.85 },
        { type: 2, x: 22, y: yBase + ySpan * 0.85 },
      ];

      sparkleDefs.forEach(def => {
        const sparkle = document.createElement('img');
        sparkle.className = `sparkle sparkle--${def.type}`;
        sparkle.src = def.type === 1 ? 'assets/sparkle1.png' : 'assets/sparkle2.png';
        sparkle.alt = '';

        const posX = def.x + (Math.random() * 4 - 2);
        const posY = def.y + (Math.random() * 4 - 2);

        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 4;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;

        sparkle.style.left = `calc(${posX.toFixed(2)}px * var(--scale))`;
        sparkle.style.top = `calc(${posY.toFixed(2)}px * var(--scale))`;
        sparkle.style.setProperty('--dx', `calc(${dx.toFixed(2)}px * var(--scale))`);
        sparkle.style.setProperty('--dy', `calc(${dy.toFixed(2)}px * var(--scale))`);

        anim.appendChild(sparkle);
      });

      pot.appendChild(anim);

      setTimeout(() => anim.remove(), 1500);
    }

    function calculateGrowThreshold(repeatType, repeatDays) {
      if (repeatType === 'daily') {
        // daily -> after watering for 5-7 times
        return Math.floor(Math.random() * 3) + 5; // 5, 6, or 7
      }
      if (repeatType === 'weekly') {
        let count = 2;
        if (Array.isArray(repeatDays)) {
          count = repeatDays.length;
        } else if (typeof repeatDays === 'number') {
          count = repeatDays;
        }
        if (count <= 0) count = 1;
        if (count > 7) count = 7;

        if (count <= 3) {
          // weekly, less than or equal to 3 times a week -> anytime on the third week of watering
          const minWaters = 2 * count + 1;
          const maxWaters = 3 * count;
          return Math.floor(Math.random() * (maxWaters - minWaters + 1)) + minWaters;
        } else {
          // weekly, more than 3 times a week -> anytime on the second week of watering
          const minWaters = count + 1;
          const maxWaters = 2 * count;
          return Math.floor(Math.random() * (maxWaters - minWaters + 1)) + minWaters;
        }
      }
      if (repeatType === 'monthly') {
        // monthly -> on the first water
        return 1;
      }
      if (repeatType === 'yearly') {
        // yearly -> on the first water
        return 1;
      }
      return 5;
    }

    // Wires one pot's click handler (open Add Plant, or the plant
    // details when planted). Called for the starting pot at load and
    // for each pot the button adds.
    function handlePotClick(pot, e) {
        if (suppressNextPotClick) {
          suppressNextPotClick = false;
          return; // was a drag, not a click
        }
        const isKeyboard = (e.clientX === 0 && e.clientY === 0);
        // The click half of a press that collected dew on
        // pointerdown: already handled — don't open anything.
        if (!isKeyboard && dewSwallowPot) {
          const swallowedPot = dewSwallowPot;
          dewSwallowPot = null;
          if (isInPlantZone(swallowedPot, e.clientX, e.clientY)) return;
        }
        // Collecting has first precedence for clicks too. This is
        // the path keyboard clicks take (they have no
        // pointerdown), and any click landing on a plant with
        // drops waiting collects them instead of opening the
        // popup.
        const dewTarget = isKeyboard
          ? (potHasDew(pot) ? pot : null)
          : dewPotAtPoint(e.clientX, e.clientY);
        if (dewTarget) {
          collectDew(dewTarget);
          return;
        }
        // Route the click to the pot whose pot-or-plant zone
        // contains the pointer, not necessarily the pot whose
        // button box was on top. Keyboard clicks use the focused
        // pot. A click in no pot's zone is ignored.
        const target = isKeyboard ? pot : potAtPoint(e.clientX, e.clientY, isInPlantZone);
        if (!target) {
          // No pot's zone holds the point — but a bin's jar may
          // sit under this pot's clear canvas; the click is the
          // bin's, then.
          if (!isKeyboard) {
            const binTarget = binAtPoint(e.clientX, e.clientY);
            if (binTarget) openBin(binTarget);
          }
          return;
        }
        if (target.classList.contains('has-plant')) {
          openPlantDetailsModal(target);
        } else {
          openModal(target);
        }
    }

    function wirePotClick(pot) {
      pot.addEventListener('click', (e) => handlePotClick(pot, e));
    }

    pots.forEach(wirePotClick);

    closeBtn.addEventListener('click', closeModal);

    function removePlant(pot) {
      if (!pot) return;
      pot.classList.remove('has-plant');
      const potPlant = pot.querySelector('.pot-plant');
      if (potPlant) potPlant.remove();

      delete pot.dataset.plantName;
      delete pot.dataset.repeat;
      delete pot.dataset.repeatType;
      delete pot.dataset.repeatDays;
      delete pot.dataset.repeatDayNum;
      delete pot.dataset.repeatMonth;
      delete pot.dataset.plantType;
      delete pot.dataset.grownPlantImg;
      delete pot.dataset.stage;
      delete pot.dataset.waterCount;
      delete pot.dataset.growThreshold;
      delete pot.dataset.wateredToday;
      delete pot.dataset.lastWateredDate;
      delete pot.dataset.streak;
      delete pot.dataset.createdDate;
      delete pot.dataset.waterHistory;
      delete pot.dataset.streakLastOppLabel;
      delete pot.dataset.plantState;
      delete pot.dataset.deadPlantImg;
      delete pot.dataset.dewToday;
      delete pot.dataset.dewCollected;
      delete pot.dataset.dewDay;

      pot.setAttribute('aria-label', 'Add a plant');
      updateDewDrops();
      saveGarden();
    }

    apRemove?.addEventListener('click', () => {
      if (!activePot) return;
      if (!apRemove.classList.contains('is-confirming')) {
        apRemove.classList.add('is-confirming');
        apRemove.textContent = 'confirm';
        return;
      }
      removePlant(activePot);
      closeModal();
    });

    // Unwater: run back everything today's watering did.
    // The watering is undone completely — it leaves the
    // history (so streaks follow), wateredToday clears (the
    // popup's water button un-greys, and the next watering
    // is the day's first again, sparkles included), a growth
    // it bought is stepped back, and a plant it revived is
    // dead again — the same undo devreset performs, for this
    // one plant — and the page closes behind the click. A
    // plant that was not watered today cannot be unwatered:
    // the button does nothing at all.
    // Runs back everything today's watering did (see the
    // unwater buttons on the Edit Plant page and the plant
    // details popup). Only acts when the plant was watered
    // today; otherwise it does nothing at all. Returns true
    // when it unwatered.
    function unwaterPlant(pot) {
      if (!pot || !pot.classList.contains('has-plant')) return false;
      const todayIso = getLocalDateStr(getGameDate());
      let history = [];
      try {
        if (pot.dataset.waterHistory) history = JSON.parse(pot.dataset.waterHistory);
      } catch (e) { }
      if (!history.includes(todayIso)) return false;
      history = history.filter(d => d !== todayIso);
      pot.dataset.waterHistory = JSON.stringify(history);
      pot.dataset.wateredToday = 'false';
      if (history.length) {
        const [y, m, d] = history[history.length - 1].split('-').map(Number);
        pot.dataset.lastWateredDate = new Date(y, m - 1, d).toDateString();
      } else {
        delete pot.dataset.lastWateredDate;
      }
      // Did today's watering count towards growth? Judged
      // on the plant as it stands without it: it counted
      // when the plant was dead (a revive always counts)
      // or due today.
      calculateStreak(pot);
      const wasDeadAtStart = getMissedOpportunitiesCount(pot) >= 1;
      const counted = wasDeadAtStart
        || pot.dataset.streakLastOppLabel === 'today';
      if (counted) {
        const wc = Math.max(0, (parseInt(pot.dataset.waterCount || '0', 10) || 0) - 1);
        pot.dataset.waterCount = String(wc);
        // A revived plant keeps its stage (a dead flower
        // comes back as a dead flower, not a dead bud).
        if (!wasDeadAtStart && pot.dataset.stage === 'grown'
          && wc < (parseInt(pot.dataset.growThreshold || '5', 10) || 5)) {
          pot.dataset.stage = 'bud';
        }
      }
      pot.dataset.streak = JSON.stringify(calculateStreak(pot));
      updatePotVisuals(pot);
      saveGarden();
      return true;
    }

    apUnwater?.addEventListener('click', () => {
      if (!activePot) return;
      if (unwaterPlant(activePot)) closeModal();
    });

    commitBtn?.addEventListener('click', () => {
      if (!checkCommitReady()) return;
      const selectedPlantBtn = document.querySelector('.ap-plant.is-selected');
      if (activePot && selectedPlantBtn) {
        const isNewPlant = !activePot.classList.contains('has-plant');
        const plantImg = selectedPlantBtn.querySelector('img');
        if (plantImg) {
          activePot.classList.add('has-plant');
          if (isNewPlant) {
            // A plant planted today starts earning tomorrow: no
            // drops to collect until the next day starts. Stamp
            // it decided-for-today with nothing assigned, so the
            // assignment pass below (updatePotVisuals) leaves it
            // alone until tomorrow.
            delete activePot.dataset.dewToday;
            delete activePot.dataset.dewCollected;
            activePot.dataset.dewDay = getLocalDateStr(getGameDate());
          }
          let potPlant = activePot.querySelector('.pot-plant');
          if (!potPlant) {
            potPlant = document.createElement('img');
            potPlant.className = 'pot-plant';
            activePot.appendChild(potPlant);
          }

          // Options chosen
          const currentRepeat = repeatOptions[repeatIndex];
          activePot.dataset.repeatType = currentRepeat;
          activePot.dataset.plantName = plantInput.value.trim();
          activePot.dataset.plantType = selectedPlantBtn.dataset.plant || '';
          activePot.dataset.grownPlantImg = plantImg.src;

          let repeatSummary = currentRepeat;
          let parsedDays = [];
          if (currentRepeat === 'weekly') {
            parsedDays = Array.from(document.querySelectorAll('.ap-day-btn.is-active')).map(b => b.textContent.trim());
            activePot.dataset.repeatDays = JSON.stringify(parsedDays);
            repeatSummary = parsedDays.join(' ') || 'weekly';
          } else if (currentRepeat === 'monthly') {
            activePot.dataset.repeatDayNum = dayNumInput.value.trim();
            repeatSummary = `on the ${dayNumInput.value || '1'}${ordinalSuffix.textContent}`;
          } else if (currentRepeat === 'yearly') {
            activePot.dataset.repeatMonth = yearMonthIndex;
            activePot.dataset.repeatDayNum = yearDayNumInput.value.trim();
            repeatSummary = `on ${monthNames[yearMonthIndex]} ${yearDayNumInput.value || '1'}${yearOrdinalSuffix.textContent}`;
          }
          activePot.dataset.repeat = repeatSummary;

          // Save chosen pot type
          const potData = potOptions[selectedPotIndex] || potOptions[0];
          activePot.dataset.potType = potData.id;
          updatePotZOrder(activePot);
          activePot.style.backgroundImage = `url("${potData.src}")`;
          activePot.classList.remove('pot--white', 'pot--blue', 'pot--yellow', 'pot--white-smallest', 'pot--orange', 'pot--grey', 'pot--orange-smaller', 'pot--white-smaller', 'pot--blue-smaller', 'pot--yellow-smaller', 'pot--grey-smaller', 'pot--orange-smallest', 'pot--yellow-smallest', 'pot--blue-smallest', 'pot--grey-smallest');
          if (potData.id === 'white') activePot.classList.add('pot--white');
          if (potData.id === 'blue') activePot.classList.add('pot--blue');
          if (potData.id === 'yellow') activePot.classList.add('pot--yellow');
          if (potData.id === 'white-smallest') activePot.classList.add('pot--white-smallest');
          if (potData.id === 'orange') activePot.classList.add('pot--orange');
          if (potData.id === 'grey') activePot.classList.add('pot--grey');
          if (potData.id === 'orange-smaller') activePot.classList.add('pot--orange-smaller');
          if (potData.id === 'white-smaller') activePot.classList.add('pot--white-smaller');
          if (potData.id === 'blue-smaller') activePot.classList.add('pot--blue-smaller');
          if (potData.id === 'yellow-smaller') activePot.classList.add('pot--yellow-smaller');
          if (potData.id === 'grey-smaller') activePot.classList.add('pot--grey-smaller');
          if (potData.id === 'orange-smallest') activePot.classList.add('pot--orange-smallest');
          if (potData.id === 'yellow-smallest') activePot.classList.add('pot--yellow-smallest');
          if (potData.id === 'blue-smallest') activePot.classList.add('pot--blue-smallest');
          if (potData.id === 'grey-smallest') activePot.classList.add('pot--grey-smallest');

          // Check if already grown or new bud
          const alreadyGrown = activePot.dataset.stage === 'grown';
          if (alreadyGrown) {
            potPlant.src = plantImg.src;
            potPlant.alt = plantInput.value.trim();
          } else {
            activePot.dataset.stage = 'bud';
            activePot.dataset.growThreshold = calculateGrowThreshold(currentRepeat, parsedDays).toString();
            if (!activePot.dataset.waterCount) {
              activePot.dataset.waterCount = '0';
            }
            potPlant.src = 'assets/bud-4.png';
            potPlant.alt = `${plantInput.value.trim()} (bud)`;
          }

          activePot.setAttribute('aria-label', `${plantInput.value.trim()} plant`);

          if (!activePot.dataset.wateredToday) {
            activePot.dataset.wateredToday = 'false';
          }
          if (!activePot.dataset.createdDate) {
            activePot.dataset.createdDate = getLocalDateStr(getGameDate());
          }
          if (!activePot.dataset.waterHistory) {
            activePot.dataset.waterHistory = JSON.stringify([]);
          }
          activePot.dataset.streak = JSON.stringify(calculateStreak(activePot));
          updatePotVisuals(activePot);
        }

        // First plant planted: hint switches to
        // "water your plant to track your progress!" (it stays put and
        // only goes away when you water). It becomes "drag to move!"
        // after the first watering, and only disappears for good after
        // a pot move made after that prompt (see noteFirstPotMoved).
        if (isNewPlant && !hasPlantedFirstPlant) {
          hasPlantedFirstPlant = true;
          updateHint();
        }
      }
      saveGarden();
      closeModal();
    });

    pdWater?.addEventListener('click', () => {
      if (!currentDetailsPot) return;
      const pot = currentDetailsPot;

      const todayStr = getGameDayStr();
      const isFirstWaterToday = (pot.dataset.wateredToday !== 'true') || (pot.dataset.lastWateredDate !== todayStr);

      // Decide BEFORE this watering is recorded whether it counts
      // towards growth. A watering only counts on one of the
      // plant's watering days — today is a scheduled opportunity,
      // which calculateStreak reports as the streak bar's last
      // slot being "today". The exception: watering a dead plant
      // always counts, even when it is past its due date — that
      // watering is the one that revives it.
      const isDead = getMissedOpportunitiesCount(pot) >= 1;
      calculateStreak(pot);
      const isDueToday = pot.dataset.streakLastOppLabel === 'today';
      const countsForGrowth = isFirstWaterToday && (isDueToday || isDead);

      // If missed watering opportunities occurred, reset growth counter
      if (isDead) {
        pot.dataset.waterCount = '0';
      }

      pot.dataset.wateredToday = 'true';
      pot.dataset.lastWateredDate = todayStr;

      // First watering: the hint moves on to "drag to move!".
      noteFirstWatered();

      const todayIso = getLocalDateStr(getGameDate());
      let history = [];
      try {
        if (pot.dataset.waterHistory) history = JSON.parse(pot.dataset.waterHistory);
      } catch (e) { }
      if (!history.includes(todayIso)) {
        history.push(todayIso);
        pot.dataset.waterHistory = JSON.stringify(history);
      }

      const streakData = calculateStreak(pot);
      pot.dataset.streak = JSON.stringify(streakData);
      updatePotVisuals(pot, isDead);

      // Only a counting watering (first water of the day, on a due
      // day or into a dead plant) grows the plant
      let shouldGrow = false;
      if (countsForGrowth) {
        let waterCount = parseInt(pot.dataset.waterCount || '0', 10);
        waterCount++;
        pot.dataset.waterCount = waterCount.toString();

        const growThreshold = parseInt(pot.dataset.growThreshold || '5', 10);
        const isBud = pot.dataset.stage === 'bud';
        shouldGrow = isBud && (waterCount >= growThreshold);
      }

      closePlantDetailsModal();
      playWateringAnimation(pot);

      if (isDead) {
        // The plant revives 0.7s after the water starts
        // falling, so it looks like the water hitting the
        // plant is what brings it back — and it comes back
        // with the growing animation.
        setTimeout(() => {
          updatePotVisuals(pot);
          const potPlant = pot.querySelector('.pot-plant');
          if (potPlant) {
            potPlant.classList.remove('plant-growing');
            void potPlant.offsetWidth;
            potPlant.classList.add('plant-growing');
          }
          playSparkleAnimation(pot);
        }, 700);
      }

      if (shouldGrow) {
        pot.dataset.stage = 'grown';
      }

      if (isFirstWaterToday) {
        // The sparkles — and, when this watering grows the plant,
        // the grow animation — start at the same moment.
        setTimeout(() => {
          playSparkleAnimation(pot);
          if (shouldGrow) {
            const potPlant = pot.querySelector('.pot-plant');
            if (potPlant && pot.dataset.grownPlantImg) {
              potPlant.src = pot.dataset.grownPlantImg;
              potPlant.alt = pot.dataset.plantName || '';
              potPlant.classList.remove('plant-growing');
              void potPlant.offsetWidth;
              potPlant.classList.add('plant-growing');
            }
          }
        }, 700);
      }
      updateDewDrops();
      saveGarden();
    });

    pdEdit?.addEventListener('click', () => {
      if (!currentDetailsPot) return;
      const pot = currentDetailsPot;
      closePlantDetailsModal();
      openModal(pot, true);
    });

    pdRemove?.addEventListener('click', () => {
      if (!currentDetailsPot) return;
      if (!pdRemove.classList.contains('is-confirming')) {
        pdRemove.classList.add('is-confirming');
        pdRemove.textContent = 'confirm';
        return;
      }
      removePlant(currentDetailsPot);
      closePlantDetailsModal();
    });

    // The details popup's unwater button (it replaced the
    // reset-position button): runs back today's watering,
    // then re-opens the popup so the water button un-greys
    // and the streak redraws — the popup stays open, ready
    // to water again. Not watered today: nothing happens.
    pdUnwater?.addEventListener('click', () => {
      if (!currentDetailsPot) return;
      if (unwaterPlant(currentDetailsPot)) {
        openPlantDetailsModal(currentDetailsPot);
      }
    });

    plantInput?.addEventListener('input', checkCommitReady);

    // Close when clicking outside modal dialogs
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    pdModal.addEventListener('click', (e) => {
      if (e.target === pdModal) {
        closePlantDetailsModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closePlantDetailsModal();
      }
    });

    // Repeat option buttons
    document.getElementById('ap-repeat-prev')?.addEventListener('click', () => {
      repeatIndex = (repeatIndex - 1 + repeatOptions.length) % repeatOptions.length;
      updateRepeat();
    });
    document.getElementById('ap-repeat-next')?.addEventListener('click', () => {
      repeatIndex = (repeatIndex + 1) % repeatOptions.length;
      updateRepeat();
    });

    dayNumInput?.addEventListener('input', updateOrdinal);
    yearDayNumInput?.addEventListener('input', updateYearOrdinal);

    yearMonthPrev?.addEventListener('click', () => {
      yearMonthIndex = (yearMonthIndex - 1 + 12) % 12;
      updateYearMonth();
    });
    yearMonthNext?.addEventListener('click', () => {
      yearMonthIndex = (yearMonthIndex + 1) % 12;
      updateYearMonth();
    });
    yearMonthVal?.addEventListener('click', () => {
      yearMonthIndex = (yearMonthIndex + 1) % 12;
      updateYearMonth();
    });

    // Day of week toggles
    dayBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('is-active');
        btn.setAttribute('aria-pressed', btn.classList.contains('is-active'));
        checkCommitReady();
      });
    });

    // Plant choices selection
    plantBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const wasSelected = btn.classList.contains('is-selected');
        plantBtns.forEach(b => b.classList.remove('is-selected'));
        if (!wasSelected) {
          btn.classList.add('is-selected');
        }
        checkCommitReady();
      });
    });

    // Plant choices carousel navigation
    let plantCarouselOffset = 0;
    const carouselTrack = document.getElementById('ap-carousel-track');

    function updatePlantCarousel() {
      if (carouselTrack) {
        carouselTrack.style.transform = `translateX(calc(${-plantCarouselOffset * 36}px * var(--scale)))`;
      }
    }

    document.getElementById('ap-plant-prev')?.addEventListener('click', () => {
      const allPlants = document.querySelectorAll('.ap-plant');
      const maxOffset = Math.max(0, allPlants.length - 5);
      if (plantCarouselOffset > 0) {
        plantCarouselOffset--;
      } else {
        plantCarouselOffset = maxOffset;
      }
      updatePlantCarousel();
    });

    document.getElementById('ap-plant-next')?.addEventListener('click', () => {
      const allPlants = document.querySelectorAll('.ap-plant');
      const maxOffset = Math.max(0, allPlants.length - 5);
      if (plantCarouselOffset < maxOffset) {
        plantCarouselOffset++;
      } else {
        plantCarouselOffset = 0;
      }
      updatePlantCarousel();
    });

    updatePlantCarousel();

    // DEV OPTION: Date Setter (Remove anytime)
    const devDateInput = document.getElementById('dev-date-input');
    const devDateReset = document.getElementById('dev-date-reset');

    function syncDevDateInput() {
      if (devDateInput) {
        devDateInput.value = getLocalDateStr(getGameDate());
      }
    }
    syncDevDateInput();

    // Drag the dev date box around by its background or label —
    // drag it out of the way, or wherever it is handy. A press that
    // starts on the date input or a button does not drag, so the
    // controls keep working as controls. The first drag switches
    // the box from right-anchored to left/top pixels, after which
    // it simply follows the pointer.
    const devDateContainer = document.getElementById('dev-date-container');
    let devDrag = null; // { dx, dy } pointer offset inside the box
    devDateContainer?.addEventListener('pointerdown', (e) => {
      if (e.target && e.target.closest && e.target.closest('input, button')) return;
      const rect = devDateContainer.getBoundingClientRect();
      devDrag = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
      devDateContainer.style.left = `${rect.left}px`;
      devDateContainer.style.top = `${rect.top}px`;
      devDateContainer.style.right = 'auto';
      devDateContainer.style.cursor = 'grabbing';
      try { devDateContainer.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
      e.preventDefault();
    });
    devDateContainer?.addEventListener('pointermove', (e) => {
      if (!devDrag) return;
      devDateContainer.style.left = `${e.clientX - devDrag.dx}px`;
      devDateContainer.style.top = `${e.clientY - devDrag.dy}px`;
    });
    function endDevDrag() {
      if (!devDrag) return;
      devDrag = null;
      devDateContainer.style.cursor = 'grab';
    }
    devDateContainer?.addEventListener('pointerup', endDevDrag);
    devDateContainer?.addEventListener('pointercancel', endDevDrag);

    devDateInput?.addEventListener('change', () => {
      if (devDateInput.value) {
        window.__DEV_DATE__ = new Date(devDateInput.value + 'T12:00:00');
      } else {
        window.__DEV_DATE__ = null;
      }
      pots.forEach(pot => {
        if (pot.classList.contains('has-plant')) {
          const tStr = getGameDayStr();
          if (pot.dataset.lastWateredDate && pot.dataset.lastWateredDate !== tStr) {
            pot.dataset.wateredToday = 'false';
          }
          updatePotVisuals(pot);
        }
      });
      // A new dev day is a new game day: assign its dew drops.
      checkDayRollover();
      if (currentDetailsPot && pdModal?.classList.contains('is-open')) {
        openPlantDetailsModal(currentDetailsPot);
      }
    });

    devDateReset?.addEventListener('click', () => {
      window.__DEV_DATE__ = null;
      syncDevDateInput();
      pots.forEach(pot => {
        if (pot.classList.contains('has-plant')) {
          const tStr = getGameDayStr();
          if (pot.dataset.lastWateredDate && pot.dataset.lastWateredDate !== tStr) {
            pot.dataset.wateredToday = 'false';
          }
          updatePotVisuals(pot);
        }
      });
      checkDayRollover();
      if (currentDetailsPot && pdModal?.classList.contains('is-open')) {
        openPlantDetailsModal(currentDetailsPot);
      }
    });

    // Secret dev commands listener:
    // - type 'devdate' to toggle dev date popup
    // - type 'devgrw' to instantly grow all plants
    // - type 'devwrg' to turn all plants back to buds (water counter reset)
    // - type 'devdew' to give every plant its dew drops
    // - type 'devreset' to reset the garden to the start of today
    let secretBuffer = '';
    const MAX_BUFFER_LEN = 10;

    function devGrowAllPlants() {
      const pots = document.querySelectorAll('.pot.has-plant');
      pots.forEach(pot => {
        pot.dataset.stage = 'grown';
        pot.dataset.plantState = 'healthy';
        delete pot.dataset.deadPlantImg;
        if (pot.dataset.growThreshold) {
          pot.dataset.waterCount = pot.dataset.growThreshold;
        }
        const potPlant = pot.querySelector('.pot-plant');
        if (potPlant && pot.dataset.grownPlantImg) {
          potPlant.src = pot.dataset.grownPlantImg;
          potPlant.alt = pot.dataset.plantName || '';
          potPlant.classList.remove('is-dead');
          potPlant.classList.remove('plant-growing');
          void potPlant.offsetWidth;
          potPlant.classList.add('plant-growing');
        }
        playSparkleAnimation(pot);
      });
      updateDewDrops();
      if (currentDetailsPot && pdModal?.classList.contains('is-open')) {
        openPlantDetailsModal(currentDetailsPot);
      }
    }

    // The reverse of devgrw: every plant goes back to a bud
    // and its growth counter resets to 0. The visuals are
    // recomputed, so a dead flower becomes a dead bud and a
    // healthy flower a healthy bud; watering history is kept.
    function devBudAllPlants() {
      document.querySelectorAll('.pot.has-plant').forEach(pot => {
        pot.dataset.stage = 'bud';
        pot.dataset.waterCount = '0';
        updatePotVisuals(pot);
      });
      saveGarden();
      if (currentDetailsPot && pdModal?.classList.contains('is-open')) {
        openPlantDetailsModal(currentDetailsPot);
      }
    }

    // Give every plant its dew drops right now, at the usual
    // rates (a dead plant's −2 is taken at once, as at day
    // start), clearing any collected state — so collection can
    // be tested on demand instead of waiting for the next day
    // start.
    function devGiveAllDew() {
      const todayStr = getLocalDateStr(getGameDate());
      document.querySelectorAll('.pot.has-plant').forEach(pot => {
        const rate = dewDropRate(pot);
        if (rate > 0) {
          pot.dataset.dewToday = String(rate);
          delete pot.dataset.dewCollected;
          pot.dataset.dewDay = todayStr;
        } else if (rate < 0) {
          pot.dataset.dewToday = String(rate);
          pot.dataset.dewCollected = 'true';
          pot.dataset.dewDay = todayStr;
        }
        renderDew(pot);
      });
      updateDewDrops();
      saveGarden();
    }

    // Reset the garden to how it stood at the start of today.
    // Today's watering is taken back: a plant it revived is
    // dead again, a bud it grew is a bud again, and the growth
    // counter steps back by the one watering. Today's dew is
    // then decided again from scratch — drops wait to be
    // collected once more, and a dead plant's −2 lands again.
    // Plants planted today stay planted: at day start they
    // were simply not here, and their dew stamp already says
    // so, so theirs is left alone.
    function devResetDay() {
      const todayIso = getLocalDateStr(getGameDate());
      document.querySelectorAll('.pot.has-plant').forEach(pot => {
        let history = [];
        try {
          if (pot.dataset.waterHistory) history = JSON.parse(pot.dataset.waterHistory);
        } catch (e) { }
        if (history.includes(todayIso)) {
          history = history.filter(d => d !== todayIso);
          pot.dataset.waterHistory = JSON.stringify(history);
          pot.dataset.wateredToday = 'false';
          if (history.length) {
            const [y, m, d] = history[history.length - 1].split('-').map(Number);
            pot.dataset.lastWateredDate = new Date(y, m - 1, d).toDateString();
          } else {
            delete pot.dataset.lastWateredDate;
          }
          // Did today's watering count towards growth? Judged
          // on the plant as it stands now — which is how it
          // stood at day start: it counts when the plant is
          // dead (a revive always counts) or due today.
          calculateStreak(pot);
          const wasDeadAtStart = getMissedOpportunitiesCount(pot) >= 1;
          const counted = wasDeadAtStart
            || pot.dataset.streakLastOppLabel === 'today';
          if (counted) {
            const wc = Math.max(0, (parseInt(pot.dataset.waterCount || '0', 10) || 0) - 1);
            pot.dataset.waterCount = String(wc);
            // Only a live bud's growing watering is undone: a
            // revived plant keeps its stage — a dead flower
            // comes back as a dead flower, not a dead bud.
            if (!wasDeadAtStart && pot.dataset.stage === 'grown'
              && wc < (parseInt(pot.dataset.growThreshold || '5', 10) || 5)) {
              pot.dataset.stage = 'bud';
            }
          }
          pot.dataset.streak = JSON.stringify(calculateStreak(pot));
        }
        if (pot.dataset.createdDate !== todayIso) {
          delete pot.dataset.dewToday;
          delete pot.dataset.dewCollected;
          delete pot.dataset.dewDay;
        }
        updatePotVisuals(pot);
      });
      resetDewGrant();
      updateDewDrops();
      saveGarden();
    }

    document.addEventListener('keydown', (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }

      if (e.key && e.key.length === 1) {
        secretBuffer += e.key.toLowerCase();
        if (secretBuffer.length > MAX_BUFFER_LEN) {
          secretBuffer = secretBuffer.slice(-MAX_BUFFER_LEN);
        }

        if (secretBuffer.endsWith('devdate')) {
          secretBuffer = '';
          const devContainer = document.getElementById('dev-date-container');
          if (devContainer) {
            const isHidden = devContainer.style.display === 'none' || devContainer.hasAttribute('hidden');
            if (isHidden) {
              devContainer.removeAttribute('hidden');
              devContainer.style.display = 'flex';
              devDateInput?.focus();
            } else {
              devContainer.style.display = 'none';
            }
          }
        } else if (secretBuffer.endsWith('devgrw')) {
          secretBuffer = '';
          devGrowAllPlants();
        } else if (secretBuffer.endsWith('devwrg')) {
          secretBuffer = '';
          devBudAllPlants();
        } else if (secretBuffer.endsWith('devdew')) {
          secretBuffer = '';
          devGiveAllDew();
        } else if (secretBuffer.endsWith('devreset')) {
          secretBuffer = '';
          devResetDay();
        }
      }
    });

    document.getElementById('dev-date-close')?.addEventListener('click', () => {
      const devContainer = document.getElementById('dev-date-container');
      if (devContainer) {
        devContainer.style.display = 'none';
      }
    });
    // /DEV OPTION: Date Setter

    updateAllPotVisuals();
