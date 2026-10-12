# Lighthouse Fixes Applied

The current production audit showed Performance **89**. The following fixes were applied for the next audit:

- Replaced the 1774×887 favicon/logo asset with a dedicated 64×64 favicon and a compact WebP header mark.
- Lazy-loaded realtime provider, notifications, and customer live chat so public routes do not load WebSocket/chat code up front.
- Deferred below-the-fold home sections with `content-visibility:auto` and `contain-intrinsic-size`.
- Reduced sticky-header backdrop blur from 18px to 10px.
- Recompressed hero carousel images where the optimized version was smaller.

Re-run `npm run lighthouse:ci` after rebuilding the frontend.
