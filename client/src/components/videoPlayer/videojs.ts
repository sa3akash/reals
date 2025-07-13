/* eslint-disable @typescript-eslint/no-require-imports */
// videojs.ts
import videojs from "video.js";

if (!videojs.getPlugin('qualityLevels')) {
  require("videojs-contrib-quality-levels");
}

export default videojs;
