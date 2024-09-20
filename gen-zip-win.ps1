$projectName = Split-Path (Get-Location) -Leaf
Remove-Item $projectName -Recurse -ErrorAction Ignore
New-Item $projectName -ItemType "directory" -ErrorAction Ignore | Out-Null
Copy-Item .\manifest.json $projectName\manifest.json -Force
Copy-Item .\block_rules.json $projectName\block_rules.json -Force
Copy-Item .\dist $projectName\dist -Recurse -Force
Remove-Item "$projectName.zip" -ErrorAction Ignore
Compress-Archive $projectName "$projectName.zip"
Remove-Item $projectName -Recurse
