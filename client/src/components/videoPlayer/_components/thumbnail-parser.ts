// thumbnail-sprite-parser.ts
export interface SpriteThumbnail {
  start: number;
  end: number;
  imageUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export async function parseVttSpriteFile(
  vttUrl: string
): Promise<SpriteThumbnail[]> {
  const baseUrl = vttUrl.substring(0, vttUrl.lastIndexOf("/") + 1);
  const res = await fetch(vttUrl);
  const text = await res.text();
  const cues: SpriteThumbnail[] = [];

  const cueRegex =
    /(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\s*\n(.+)/g;

  const toSeconds = (t: string) => {
    const [h, m, s] = t.split(":");
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
  };

  let match;
  while ((match = cueRegex.exec(text)) !== null) {
    const start = toSeconds(match[1]);
    const end = toSeconds(match[2]);
    const imageLine = match[3].trim(); // preview-strip.jpg#xywh=160,90,160,90

    const [file, xywh] = imageLine.split("#xywh=");
    const [x, y, w, h] = xywh.split(",").map(Number);

    cues.push({
      start,
      end,
      imageUrl: baseUrl + file,
      x,
      y,
      w,
      h,
    });
  }

  return cues;
}
