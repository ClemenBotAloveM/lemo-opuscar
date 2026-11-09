#!/bin/sh
# One-command build for "Lajawaab" (skill mode: LIB is the library path printed by setup.sh)
set -e
export PATH="/home/user/.lemo-tools/bin:/usr/local/bin:$PATH"
export PLAYWRIGHT_CHROME=/tmp/chromium
export LD_LIBRARY_PATH="/home/user/.lemo-tools/al2023-lib/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export LEMO_ANGLE=swiftshader
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=/home/user/lemo-opuscar
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE"
node "$HERE/cues.mjs" > "$HERE/cues.json"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/lajawaab.mp4" 24 0
"$LIB/.venv/bin/python" "$LIB/core/render/srt.py" "$HERE/cues.json" "$HERE/lajawaab.srt"
echo "film: $HERE/lajawaab.mp4"
