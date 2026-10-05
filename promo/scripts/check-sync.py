"""
Sync check for a rendered promo: does the picture move when the music hits?

    python3 promo/scripts/check-sync.py promo/out/valentine-tattoo-promo.mp4 [out.png]

Decodes the video at low resolution and measures, per frame, how much the
picture changes (mean absolute difference from the previous frame) and how
bright it is. The plot sets those against the track's bass onsets and the
pluck / kick events the composition was keyed to, and the script prints, for
every pluck, how far the nearest visual peak lies from it.
"""
import json
import re
import subprocess
import sys

import numpy as np
import librosa
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

video = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else video.rsplit(".", 1)[0] + "-sync.png"

probe = json.loads(subprocess.check_output(
    ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "json", video]))
num, den = map(int, probe["streams"][0]["r_frame_rate"].split("/"))
fps = num / den

w, h = 192, 108
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"])
frames = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32) / 255
diff = np.concatenate([[0], np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))])
luma = frames.mean(axis=(1, 2))
ft = np.arange(len(frames)) / fps

y, sr = librosa.load(video, sr=22050, mono=True)
hop = 256
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
f = librosa.fft_frequencies(sr=sr, n_fft=2048)
band = (f > 60) & (f < 700)
flux = np.maximum(0, np.diff(np.log1p(20 * S[band]), axis=1)).sum(0)
flux = np.concatenate([[0], flux])
at = np.arange(len(flux)) * hop / sr

src = open("promo/composition/audio-map.js").read()
amap = json.loads(re.search(r"window\.AUDIO_MAP = (\{.*\});", src, re.S).group(1))
plucks = [p["t"] for p in amap["plucks"]]
kicks = amap["kicks"]
bars = amap["bars"]

# For each pluck: offset of the largest picture change within ±120 ms.
offsets = []
for p in plucks:
    sel = (ft >= p - 0.12) & (ft <= p + 0.12)
    if sel.any():
        i = np.argmax(diff[sel])
        offsets.append((p, ft[sel][i] - p, diff[sel][i]))
off = np.array([o[1] for o in offsets])
print(f"plucks checked: {len(off)}   visual peak offset: median {np.median(off)*1000:+.0f} ms, "
      f"mean |offset| {np.mean(np.abs(off))*1000:.0f} ms, within one frame: {np.mean(np.abs(off) <= 1/fps + 1e-6)*100:.0f}%")

fig, ax = plt.subplots(3, 1, figsize=(26, 10), sharex=True)
ax[0].plot(at, flux / flux.max(), lw=0.6, color="#555")
ax[0].set_ylabel("bass onsets")
ax[1].plot(ft, diff / diff.max(), lw=0.8, color="#7a3cff")
ax[1].set_ylabel("picture change")
ax[2].plot(ft, luma, lw=0.8, color="#222")
ax[2].set_ylabel("brightness")
for a in ax:
    for p in plucks:
        a.axvline(p, color="#e0a000", lw=0.7, alpha=0.8)
    for k in kicks:
        a.axvline(k, color="#d02020", lw=0.9, alpha=0.8)
    for b in bars:
        a.axvline(b, color="#2080d0", lw=0.5, ls="--", alpha=0.6)
ax[2].set_xlim(0, ft[-1])
ax[2].set_xticks(np.arange(0, ft[-1], 1))
ax[0].set_title("orange: bass plucks · red: kicks · blue dashed: bar lines")
plt.tight_layout()
plt.savefig(out, dpi=60)
print("wrote", out)
