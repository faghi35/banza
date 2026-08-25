@echo off
set BODY={"prompt":"a red apple on a white background","width":512,"height":512,"steps":4,"seed":3}
curl -sS -o "
G:\Users\FAGHI CHOLA\banza-ai
\nvimg_out2.json" -w "HTTP=%{http_code} TIME=%{time_total}" -X POST https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell -H "Content-Type: application/json" -H "Authorization: Bearer 
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
" -d %BODY%
echo DONE > "
G:\Users\FAGHI CHOLA\banza-ai
\nvimg_done.flag"
