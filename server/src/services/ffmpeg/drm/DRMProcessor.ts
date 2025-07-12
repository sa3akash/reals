import { execFileSync } from "child_process";
import path from "path";

interface DRMKey {
  label: string;
  keyId: string;
  key: string;
}

export class DRMProcessor {
  constructor(private packagerPath = "packager") {}

  processWithRawKeys(input: string, outputDir: string, keys: DRMKey[]) {
    const args: string[] = [];
    keys.forEach(k => {
      args.push(
        `input=${input},stream=audio,output=${path.join(outputDir, `audio-${k.label}.mp4`)}`,
        `input=${input},stream=video,output=${path.join(outputDir, `video-${k.label}.mp4`)}`
      );
    });
    args.push("--enable_raw_key_encryption");
    args.push("--protection_systems", "Widevine,PlayReady");
    args.push("--keys", keys.map(k => `label=${k.label}:key_id=${k.keyId}:key=${k.key}`).join(","));
    args.push("--hls_master_playlist_output", path.join(outputDir, "drm-master.m3u8"));
    execFileSync(this.packagerPath, args, { stdio: "inherit" });
  }
}
