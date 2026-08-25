$ErrorActionPreference = 'Stop'
$mysql = 'C:\xampp\mysql\bin\mysql.exe'
$key = (& $mysql -u root -h 127.0.0.1 banza_ai -N -e "SELECT api_key FROM llm_models WHERE id=2 LIMIT 1;").Trim()
$dir = 'G:\Users\FAGHI CHOLA\banza-ai'
$out = Join-Path $dir 'nvimg_out.json'
$payload = '{"prompt":"a red apple on a white background, studio product photo","width":512,"height":512,"steps":4,"seed":7}'
try {
    $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell')
    $req.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $key)
    $req.Content = [System.Net.Http.StringContent]::new($payload, [System.Text.Encoding]::UTF8, 'application/json')
    $client = [System.Net.Http.HttpClient]::new()
    $client.Timeout = [TimeSpan]::FromSeconds(110)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $resp = $client.SendAsync($req).GetAwaiter().GetResult()
    $elapsed = $sw.ElapsedMilliseconds
    $txt = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    [System.IO.File]::WriteAllText($out, ('HTTP=' + [int]$resp.StatusCode + ' MS=' + $elapsed + "`n" + $txt.Substring(0, [Math]::Min($txt.Length, 4000))))
} catch {
    [System.IO.File]::WriteAllText($out, 'EXCEPTION: ' + $_.Exception.Message)
}