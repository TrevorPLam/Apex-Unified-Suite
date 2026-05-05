param(
    [string]$TasksPath = "./tasks",
    [string]$OutputPath = "./tasks/TASKS.md"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$TasksPath = Join-Path $RootDir $TasksPath
$OutputPath = Join-Path $RootDir $OutputPath

Write-Host "Scanning tasks directory: $TasksPath"

# Get all markdown files
$files = Get-ChildItem -Path $TasksPath -Filter "*.md" -Recurse

# Start building output
$output = @()
$output += "# TASKS.md - Consolidated Task Documentation"
$output += ""
$output += "This document consolidates all task documentation from /tasks/ directory."
$output += ""
$output += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"
$output += "Total files: $($files.Count)"
$output += ""
$output += "## Table of Contents"
$output += ""
$output += "| File | Path |"
$output += "|------|------|"

# Process each file
foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($TasksPath, "").TrimStart('\', '/')
    $fileName = $file.Name
    
    $output += "| [$fileName]#$($fileName -replace '\.md$', '') | $relativePath |"
}

$output += ""
$output += "---"
$output += ""

# Add file contents
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $relativePath = $file.FullName.Replace($TasksPath, "").TrimStart('\', '/')
    
    $output += "# $($file.Name -replace '\.md$', '')"
    $output += ""
    $output += "**Path:** $relativePath"
    $output += ""
    $output += $content
    $output += ""
    $output += "---"
    $output += ""
}

# Write output
$output | Out-File -FilePath $OutputPath -Encoding UTF8 -Force
Write-Host "Created TASKS.md with $($files.Count) files"
