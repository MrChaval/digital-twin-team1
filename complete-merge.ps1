# Complete the merge and commit changes
Set-Location "c:\Users\JaiZz\OneDrive - MIMO Tech Co.,Ltd\Desktop\Digital Twin Team1\digital-twin-team1"

# Set git to use a non-interactive editor
$env:GIT_EDITOR = "true"

# Check if there's a merge in progress
if (Test-Path ".git/MERGE_HEAD") {
    Write-Host "Merge in progress, completing it..."
    
    # Add all changes
    git add -A
    
    # Complete the merge with a commit message
    git -c core.editor=true commit --no-edit 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to complete merge, aborting..."
        git merge --abort 2>&1
        Write-Host "Merge aborted. Please try again."
    } else {
        Write-Host "Merge completed successfully!"
    }
} else {
    Write-Host "No merge in progress."
    
    # Just commit the current staged changes
    git add lib/db.ts drizzle/0000_flaky_hobgoblin.sql drizzle/meta/0000_snapshot.json
    git commit -m "feat: Add attack_logs table for Arcjet threat monitoring

- Added attack_logs table to track Arcjet security violations  
- Logs: bot detection, rate limiting, SQL injection, XSS attempts
- Includes geolocation data (IP, city, country, lat/long)
- Middleware already configured to log all Arcjet denials
- Both audit_logs (internal) and attack_logs (external) tables"
}

Write-Host "`nCurrent status:"
git status --short

Write-Host "`nRecent commits:"
git log --oneline -3
