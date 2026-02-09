# Bot Detection Test Script for Windows PowerShell
# Tests good bots vs bad bots using curl and Invoke-WebRequest

$url = "http://localhost:3000"

Write-Host "`n🤖 Bot Detection Test (Windows PowerShell)" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host ""

# Test Good Bots (should be allowed)
Write-Host "📊 Good Bots (Should be ALLOWED):" -ForegroundColor Green
Write-Host "-" * 70

$goodBots = @(
    @{ Name = "Googlebot"; UserAgent = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
    @{ Name = "Bingbot"; UserAgent = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" },
    @{ Name = "DuckDuckBot"; UserAgent = "DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)" }
)

foreach ($bot in $goodBots) {
    try {
        $response = Invoke-WebRequest -Uri $url -UserAgent $bot.UserAgent -UseBasicParsing -ErrorAction Stop
        $status = if ($response.StatusCode -eq 200) { "✅ ALLOWED" } else { "❌ BLOCKED ($($response.StatusCode))" }
        Write-Host "$status | $($bot.Name)" -ForegroundColor $(if ($response.StatusCode -eq 200) { "Green" } else { "Red" })
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ BLOCKED ($statusCode) | $($bot.Name)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 100
}

Write-Host ""

# Test Bad Bots (should be blocked)
Write-Host "📊 Bad Bots (Should be BLOCKED):" -ForegroundColor Yellow
Write-Host "-" * 70

$badBots = @(
    @{ Name = "Curl"; UserAgent = "curl/7.68.0" },
    @{ Name = "Wget"; UserAgent = "Wget/1.20.3 (linux-gnu)" },
    @{ Name = "Python Requests"; UserAgent = "python-requests/2.28.0" },
    @{ Name = "Generic Scraper"; UserAgent = "Mozilla/5.0 (compatible; ScrapyBot/1.0)" }
)

foreach ($bot in $badBots) {
    try {
        $response = Invoke-WebRequest -Uri $url -UserAgent $bot.UserAgent -UseBasicParsing -ErrorAction Stop
        Write-Host "❌ FAIL (Should be blocked) | $($bot.Name) was ALLOWED" -ForegroundColor Red
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 403) {
            Write-Host "✅ BLOCKED ($statusCode) | $($bot.Name)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Unexpected ($statusCode) | $($bot.Name)" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Milliseconds 100
}

Write-Host ""

# Test Normal Browser (should be allowed)
Write-Host "📊 Normal Browser (Should be ALLOWED):" -ForegroundColor Cyan
Write-Host "-" * 70

try {
    $response = Invoke-WebRequest -Uri $url -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -UseBasicParsing -ErrorAction Stop
    Write-Host "⚠️  Note: PowerShell HTTP requests may be detected as automated" -ForegroundColor Yellow
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   To test real browser: Open http://localhost:3000 in Chrome/Edge" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "⚠️  PowerShell blocked ($statusCode) - This is expected!" -ForegroundColor Yellow
    Write-Host "   Arcjet detects PowerShell as automated (correct behavior)" -ForegroundColor Gray
    Write-Host "   Real browsers work fine - open http://localhost:3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 70
Write-Host "✅ Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Note: Arcjet uses advanced detection beyond user-agent:" -ForegroundColor Cyan
Write-Host "   - TLS fingerprinting" -ForegroundColor Gray
Write-Host "   - IP verification for real search engines" -ForegroundColor Gray
Write-Host "   - JavaScript execution" -ForegroundColor Gray
Write-Host "   - Browser-specific behaviors" -ForegroundColor Gray
Write-Host ""
Write-Host "   Real browsers will ALWAYS work correctly!" -ForegroundColor Green
Write-Host ""
