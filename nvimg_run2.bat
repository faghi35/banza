@echo off
set DIR=G:\Users\FAGHI CHOLA\banza-ai
REM PROBE NVIDIA FLUX.1-SCHNELL (real API verification)
curl -sS -o "%DIR%\nvimg_resp.json" -w "HTTP=%%{http_code} TIME=%%{time_total}" -X POST https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell -H "Content-Type: application/json" -H "Authorization: Bearer %NVIDIA_PROBE_KEY%" --data "@%DIR%\nvimg_payload.json" > "%DIR%\nvimg_status.txt" 2>&1
echo PROBE_DONE > "%DIR%\nvimg_done.flag"