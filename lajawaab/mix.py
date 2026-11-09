"""mix.py — "Lajawaab": beds + foley + original guqin/xiao score → out/mix.wav.
Every sound comes from events.json (the page's window.EV), i.e. from story.js — one timeline."""
import json, sys, os
import numpy as np
import soundfile as sf

LIB = "/home/user/lemo-opuscar"
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, LIB)
from core.audio import sfx, pluck as P  # noqa: E402

SR = 48000
ev_all = json.load(open(f"{HERE}/events.json"))
EV = ev_all["ev"]
DUR = 62.0
buf = np.zeros((int(DUR * SR), 2), np.float32)
rng = np.random.default_rng(41)


def place(x, at, gain=1.0, pan=0.0):
    x = np.asarray(x, np.float32)
    sfx.add(buf, x, float(at), float(gain), float(pan))


# ---------- beds ----------
def window_env(n, t0, t1, fade=1.0):
    t = np.arange(n) / SR
    return np.clip((t - (0)) / fade, 0, 1) * np.clip(((t1 - t0) - t) / fade, 0, 1)


def bed(name, t0, t1):
    d = t1 - t0
    n = int(d * SR)
    t = np.arange(n) / SR
    if name == "room":
        x = sfx.brown(d) * .032
    elif name == "wind":
        swell = .55 + .45 * np.sin(2 * np.pi * .07 * t + 1.2)
        x = sfx.bp(sfx.noise(d), 180, 850) * .05 * swell
        # the breath: wind ducked 26-29 s (absolute times inside the bed window)
        duck = np.ones(n)
        a, b = int((26 - t0) * SR), int((29 - t0) * SR)
        if b > 0 and a < n: duck[max(0, a):min(n, b)] = .22
        x *= duck
    elif name == "rain":
        x = sfx.hp(sfx.noise(d), 2400) * .075 * window_env(n, t0, t1, .8)
    else:  # mist
        x = sfx.bp(sfx.noise(d), 100, 420) * .04 * window_env(n, t0, t1, 1.6)
    place(x, t0, 1.0, 0.0)


# ---------- foley ----------
def f_brush(d=1.0, gain=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    lo = sfx.bp(sfx.noise(d), 700, 2500); hi = sfx.bp(sfx.noise(d), 1800, 5200)
    x = (lo * (1 - t / d) + hi * (t / d)) * np.minimum(1, t / .12) * np.exp(-t * 1.4)
    for i in range(12):  # bristle grains
        at = int((.03 + rng.random() * .85) * n)
        g = np.exp(-np.arange(int(.012 * SR)) / (.003 * SR))
        m = min(len(g), n - at)
        x[at:at + m] += sfx.hp(sfx.noise(.012), 3000)[:m] * g[:m] * .5
    return sfx.norm(x) * .5 * gain


def f_inkdrop():
    t = np.arange(int(.09 * SR)) / SR
    ping = np.sin(2 * np.pi * (2400 - 1100 * t / .09) * t) * np.exp(-t * 46)
    thud = sfx.thump(v=.5, f=95)
    out = np.zeros(max(len(ping), len(thud)), np.float32)
    out[:len(ping)] += ping * .5
    out[:len(thud)] += thud * .45
    return out


def f_step(v=1.0):
    x = sfx.step(v)
    sp = sfx.hp(sfx.noise(.07), 1800) * np.exp(-np.arange(int(.07 * SR)) / (.014 * SR))
    out = np.zeros(max(len(x), len(sp)), np.float32)
    out[:len(sp)] += sp * .3 * v
    out[:len(x)] += x * .8
    return out


def f_wings():
    out = np.zeros(int(.8 * SR), np.float32)
    for k, at in enumerate([0, .22, .46]):
        d = .16
        n = int(d * SR)
        env = np.sin(np.pi * np.arange(n) / n) ** 2
        seg = sfx.bp(sfx.noise(d), 260, 1100) * env * (.5 - k * .12)
        i0 = int(at * SR)
        out[i0:i0 + n] += seg
    return out


def f_drip():
    t = np.arange(int(.09 * SR)) / SR
    return np.sin(2 * np.pi * (2000 - 1100 * t / .09) * t) * np.exp(-t * 38) * .5


def f_snap():
    n = int(.06 * SR)
    x = sfx.hp(sfx.noise(.06), 2600) * np.exp(-np.arange(n) / (.012 * SR)) * .8
    cl = sfx.click(1.2)
    m = min(len(cl), n)
    x[:m] += cl[:m] * .4
    return x


def f_heart(v=1.0):
    a = sfx.thump(v=.5 * v, f=52)
    out = np.zeros(int(.5 * SR), np.float32)
    m = min(len(a), len(out))
    out[:m] += a[:m]
    b = sfx.thump(v=.32 * v, f=48)
    i0 = int(.18 * SR)
    m = min(len(b), len(out) - i0)
    if m > 0:
        out[i0:i0 + m] += b[:m]
    return out


def f_tick():
    n = int(.03 * SR)
    return sfx.hp(sfx.noise(.03), 3200) * np.exp(-np.arange(n) / (.006 * SR)) * .3


def f_seal():
    out = np.zeros(int(.5 * SR), np.float32)
    th = sfx.thump(v=.9, f=70)
    m = min(len(th), len(out))
    out[:m] += th[:m]
    for i in range(12):
        at = int(rng.random() * .22 * SR)
        n = int(.022 * SR)
        if at + n < len(out):
            out[at:at + n] += sfx.hp(sfx.noise(.022), 4000) * np.exp(-np.arange(n) / (.005 * SR)) * .16
    return out


def f_gong(f0=118.0, d=5.0):
    t = np.arange(int(d * SR)) / SR
    x = np.zeros_like(t)
    for r, a, dk in [(1, 1, 4.2), (2.76, .55, 2.8), (5.4, .3, 1.8), (8.93, .18, 1.1)]:
        x += a * np.sin(2 * np.pi * f0 * r * (1 + .0015 * np.sin(2 * np.pi * .4 * t)) * t) * np.exp(-t / dk)
    on = sfx.bp(sfx.noise(.14), 300, 2400) * np.exp(-np.arange(int(.14 * SR)) / (.03 * SR))
    m = min(len(on), len(x))
    x[:m] += on[:m] * .8
    return sfx.norm(x) * .8


def xiao(pitch, d, vel):
    f = P._hz(P.midi(pitch))
    t = np.arange(int(d * SR)) / SR
    vib = 1 + .006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 1.2)
    y = np.sin(2 * np.pi * f * t * vib) + .32 * np.sin(2 * np.pi * 2 * f * t) + .12 * np.sin(2 * np.pi * 3 * f * t)
    breath = sfx.bp(sfx.noise(d), max(120, f * .8), f * 2.4) * .18
    env = np.minimum(1, t / .35) * np.exp(-t * .5) * np.minimum(1, (d - t) / .35)
    return sfx.norm((y * .5 + breath) * env) * .55 * vel


FOLEY = {
    "brush": lambda e: (f_brush(1.0, e.get("gain", .9)), e.get("gain", .9)),
    "inkdrop": lambda e: (f_inkdrop(), .9),
    "step": lambda e: (f_step(e.get("gain", .6)), e.get("gain", .8)),
    "wings": lambda e: (f_wings(), .5),
    "drip": lambda e: (f_drip(), .8),
    "snap": lambda e: (f_snap(), .9),
    "heart": lambda e: (f_heart(), .8),
    "tick": lambda e: (f_tick(), .8),
    "seal": lambda e: (f_seal(), .95),
}

# ---- render everything except the sounds allowed inside the silence ----
for e in EV:
    typ = e.get("type")
    if typ == "bed":
        bed(e["name"], e["t"], e["t1"])
    elif typ in FOLEY and typ not in ("drip", "snap"):
        x, g = FOLEY[typ](e)
        place(x, e["t"], g, e.get("pan", 0))
    elif typ == "note":
        kw = {}
        if e.get("har"):
            kw["harmonic"] = True
        if e.get("bend"):
            kw["bend"] = e["bend"]
        x = P.pluck("guqin", e["pitch"], e.get("dur"), e.get("vel", .8), **kw)
        place(x, e["t"], .8, e.get("pan", 0))
    elif typ == "strum":
        x = P.strum("guqin", e["pitches"], e.get("dur", 2), e.get("vel", .8),
                    spread=e.get("spread", .025), up=e.get("up", False))
        place(x, e["t"], .8, e.get("pan", 0))
    elif typ == "xiao":
        x = xiao(e["pitch"], e.get("dur", 3), e.get("vel", .5))
        place(x, e["t"], .8, e.get("pan", 0))
    elif typ == "gong":
        x = f_gong()
        place(x, e["t"], .75, e.get("pan", 0))

# ---- the held silence (37.05–40.92): the bus goes to true zero ----
g0, g1 = int(37.05 * SR), int(40.92 * SR)
ramp = int(.08 * SR)
buf[g0:g1] = 0.0
buf[g0 - ramp:g0] *= np.linspace(1, 0, ramp)[:, None]
buf[g1:g1 + ramp] *= np.linspace(0, 1, ramp)[:, None]

# sounds that live INSIDE the silence: one drip, then the snap
for e in EV:
    if e.get("type") in ("drip", "snap"):
        x, g = FOLEY[e["type"]](e)
        place(x, e["t"], g, e.get("pan", 0))

# ---- ceiling ----
for ch in range(2):
    buf[:, ch] = sfx.limit(buf[:, ch], ceil=.88)

os.makedirs(f"{HERE}/out", exist_ok=True)
sf.write(f"{HERE}/out/mix.wav", buf, SR)
print(f"wrote {HERE}/out/mix.wav peak={np.abs(buf).max():.3f}")
