"""
Audio map for the promo video.

Reads the first seconds of the track and writes `promo/composition/audio-map.js`:
the musical grid, the events the picture cuts on, and per-frame band envelopes
the picture breathes with. Everything visual in the composition is keyed to
this file, never to hand-typed timestamps.

    python3 promo/scripts/analyze-audio.py "<path/to/Addiction_slowed.mp3>"

Findings this script encodes (see promo/README.md for the full reading):

* the groove is 87.38 BPM in 4/4; every event sits on a sixteenth grid of
  0.17166 s. Bar 1 starts with the first sound, at 0.050 s.
* the bass pluck is grouped in threes: hits on sixteenths 0, 3, 6, 9 (then a
  variation in the last quarter of the bar). Groups of three sixteenths are
  dotted eighths, 0.515 s apart, about 116.5 a minute against the 87.4 pulse:
  that 3-against-4 is what makes the line feel like triplets.
* 0.05–5.21 s intro (drone + bell line, riser in bar 2), 5.21–5.54 s two
  sixteenths of silence, 5.54 s the drop (bar 3), 27.52 s the four-on-the-floor
  kick enters (bar 11).
"""
import json, sys
import numpy as np
import librosa
import scipy.signal as ss

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else "promo/composition/audio-map.js"
DUR = 34.0          # analysed span (the video uses ~31 s)
FPS = 60

y, sr = librosa.load(SRC, sr=44100, mono=True, duration=DUR)

# --- grid -------------------------------------------------------------------
# Period and phase were fitted by maximising onset strength on the grid over
# 5.5–44 s; the phase is pinned to the drop's measured attack (5.5435 s), which
# is also exactly 32 sixteenths after the first sound.
SIX = 0.17166
DROP = 5.5435
T0 = DROP - 32 * SIX                      # bar 1 downbeat (0.050 s)
BEAT, BAR = 4 * SIX, 16 * SIX

def slot_time(n):
    return T0 + n * SIX

# --- spectral flux per band ---------------------------------------------------
hop = 64
fr = sr / hop
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)

def flux(lo, hi):
    m = (freqs >= lo) & (freqs < hi)
    X = np.log1p(50 * S[m] / (S[m].max() + 1e-9))
    d = np.maximum(0, np.diff(X, axis=1)).sum(0)
    return np.concatenate([[0], d])

def at_slot(F, n):
    """Onset strength in the attack window of a sixteenth (−10 ms … +45 ms)."""
    i = int(slot_time(n) * fr)
    return float(F[max(0, i - int(0.010 * fr)): i + int(0.045 * fr)].max())

F_sub, F_bass, F_low = flux(25, 80), flux(80, 260), flux(260, 700)
F_snr, F_hat = flux(1200, 4000), flux(7000, 14000)

n_slots = int((DUR - T0) / SIX)

def bar_normalised(F):
    """Per-slot strength normalised to the loudest slot of its own bar."""
    vals = np.array([at_slot(F, n) for n in range(n_slots)])
    out = np.zeros_like(vals)
    for b in range(0, n_slots, 16):
        seg = vals[b:b + 16]
        out[b:b + 16] = seg / (seg.max() + 1e-9)
    return out

V_sub, V_bass, V_low = bar_normalised(F_sub), bar_normalised(F_bass), bar_normalised(F_low)
V_snr, V_hat = bar_normalised(F_snr), bar_normalised(F_hat)

GAP = (5.2119, 5.5410)
SECTION_B = T0 + 160 * SIX               # bar 11

def in_gap(t):
    return GAP[0] - 0.02 <= t <= GAP[1]

# Pluck: the bass line's attacks in the drop section (bars 3–10). The
# "triplet" skeleton 0-3-6-9 is always kept when it sounds; anything else must
# clearly stand out in its bar.
plucks = []
for n in range(32, 160):
    t = slot_time(n)
    s = 0.6 * V_bass[n] + 0.25 * V_low[n] + 0.15 * V_sub[n]
    slot = n % 16
    skeleton = slot in (0, 3, 6, 9)
    if (skeleton and s > 0.42) or s > 0.62:
        plucks.append({"t": round(t, 4), "s": round(min(1.0, s), 3), "slot": slot,
                       "bar": n // 16 + 1, "skeleton": skeleton})

# Kicks: four on the floor from bar 11.
kicks = [round(T0 + 160 * SIX + k * BEAT, 4) for k in range(0, 12) if T0 + 160 * SIX + k * BEAT < DUR]

# Snare / clap and hats over the whole span (grid-locked, per-bar normalised).
snares = [{"t": round(slot_time(n), 4), "s": round(float(V_snr[n]), 3)}
          for n in range(0, n_slots) if V_snr[n] > 0.82 and not in_gap(slot_time(n))]
hats = [{"t": round(slot_time(n), 4), "s": round(float(V_hat[n]), 3)}
        for n in range(16, n_slots) if V_hat[n] > 0.7 and not in_gap(slot_time(n))]

# Intro bell / lead line (bars 1–2): free-running onsets in 500 Hz–3 kHz.
F_mid = flux(500, 3000)
pk, pr = ss.find_peaks(F_mid / np.percentile(F_mid[: int(5.2 * fr)], 99.5),
                       height=0.35, distance=int(0.14 * fr))
bells = [round(p / fr, 4) for p in pk if 0.03 < p / fr < GAP[0] - 0.05]

# --- envelopes at video frame rate ---------------------------------------------
def band_env(lo, hi, attack=0.004, release=0.12):
    sos = ss.butter(4, [lo, hi], btype="band", fs=sr, output="sos") if lo > 0 else \
        ss.butter(4, hi, btype="low", fs=sr, output="sos")
    z = ss.sosfiltfilt(sos, y)
    win = int(sr / FPS)
    frames = int(DUR * FPS)
    rms = np.array([np.sqrt(np.mean(z[i * win:(i + 1) * win] ** 2) + 1e-12) for i in range(frames)])
    # fast attack, slower release: the picture reacts on the hit, then relaxes
    out = np.zeros_like(rms)
    a = 1 - np.exp(-1 / (attack * FPS)); r = 1 - np.exp(-1 / (release * FPS))
    for i, v in enumerate(rms):
        prev = out[i - 1] if i else 0
        out[i] = prev + (v - prev) * (a if v > prev else r)
    ref = np.percentile(out[: int(31 * FPS)], 99)
    return np.clip(out / ref, 0, 1.2)

env = {
    "sub": band_env(0, 80),
    "bass": band_env(80, 300),
    "mid": band_env(300, 2500),
    "high": band_env(4000, 16000, release=0.08),
}
# Riser: the high band's slow trend across bar 2, 0 → 1 at the cut.
hi_slow = band_env(4000, 16000, attack=0.25, release=0.25)
riser = np.zeros_like(hi_slow)
i0, i1 = int(T0 * FPS + BAR * FPS), int(GAP[0] * FPS)
seg = hi_slow[i0:i1]
riser[i0:i1] = np.clip((seg - seg.min()) / (seg.max() - seg.min() + 1e-9), 0, 1)

data = {
    "source": "Addiction (slowed) — first 34 s",
    "fps": FPS,
    "bpm": round(60 / BEAT, 3),
    "sixteenth": SIX, "beat": round(BEAT, 5), "bar": round(BAR, 5),
    "t0": round(T0, 4), "drop": DROP, "gap": [round(GAP[0], 4), round(GAP[1], 4)],
    "sectionB": round(SECTION_B, 4),
    "bars": [round(T0 + k * BAR, 4) for k in range(0, int((DUR - T0) / BAR) + 1)],
    "plucks": plucks, "kicks": kicks, "snares": snares, "hats": hats, "bells": bells,
    "env": {k: [round(float(v), 3) for v in arr] for k, arr in env.items()},
    "riser": [round(float(v), 3) for v in riser],
}
with open(OUT, "w") as fh:
    fh.write("// Generated by promo/scripts/analyze-audio.py — do not edit by hand.\n")
    fh.write("window.AUDIO_MAP = ")
    json.dump(data, fh, separators=(",", ":"))
    fh.write(";\n")

print(f"bpm {data['bpm']}  bars {data['bars'][:12]}")
print(f"plucks {len(plucks)}  kicks {len(kicks)}  snares {len(snares)}  hats {len(hats)}  bells {len(bells)}")
for b in range(3, 11):
    row = ['.'] * 16
    for p in plucks:
        if p['bar'] == b:
            row[p['slot']] = 'X' if p['s'] > 0.75 else 'x'
    print(f"  bar {b:2d} pluck |{' '.join(''.join(row[i:i+4]) for i in range(0,16,4))}|")
print("bells", bells)
