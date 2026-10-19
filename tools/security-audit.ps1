[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$safeDirectory = $repositoryRoot.Replace('\', '/')
$findings = [System.Collections.Generic.List[object]]::new()

$forbiddenPathPattern = '(^|/)(\.env($|\.)|\.secrets/|secrets/|\.local/|\.maven/|\.tools/|node_modules/|target/|dist/)|\.(mv|trace|lock)\.db$|\.(pem|key|p12|pfx|jks|keystore)$|(^|/)(id_rsa|id_ed25519|credentials[^/]*)$'
$binaryExtensionPattern = '\.(jar|png|jpe?g|gif|ico|woff2?|ttf|zip|gz|pdf|class|exe|dll|mv\.db|p12|pfx|jks|keystore)$'
$highRiskPatterns = [ordered]@{
    PrivateKey   = '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
    GitHubToken  = '\bgh[pousr]_[A-Za-z0-9_]{20,}\b'
    AwsAccessKey = '\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'
    SlackToken   = '\bxox[baprs]-[A-Za-z0-9-]{10,}\b'
    Jwt           = '\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b'
    CredentialUrl = '[a-zA-Z][a-zA-Z0-9+.-]*://[^/\s:@]+:[^@\s/]+@'
}

function Add-Finding {
    param(
        [string]$Rule,
        [string]$Path,
        [string]$Revision
    )

    $findings.Add([pscustomobject]@{
        Rule = $Rule
        Revision = $Revision
        Path = $Path
    })
}

function Test-TextContent {
    param(
        [string]$Content,
        [string]$Path,
        [string]$Revision
    )

    if ($Path -eq 'tools/security-audit.ps1') {
        return
    }

    foreach ($rule in $highRiskPatterns.GetEnumerator()) {
        if ($Content -match $rule.Value) {
            Add-Finding -Rule $rule.Key -Path $Path -Revision $Revision
        }
    }

    if ($Path -notmatch '(?i)(\.env|\.ya?ml|\.properties)$') {
        return
    }

    foreach ($line in ($Content -split "`r?`n")) {
        $key = $null
        $value = $null

        if ($line -match '^\s*([A-Z][A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*(.*)$') {
            $key = $Matches[1]
            $value = $Matches[2]
        } elseif ($line -match '^\s*(password|secret|token|api[-_]?key|private[-_]?key)\s*:\s*(.*)$') {
            $key = $Matches[1]
            $value = $Matches[2]
        }

        if (-not $key) {
            continue
        }

        $normalizedValue = $value.Trim().Trim('"', "'")
        $isEmpty = [string]::IsNullOrWhiteSpace($normalizedValue)
        $isEnvironmentReference = $normalizedValue -match '^\$\{[^}]+\}$'
        $isDocumentedPlaceholder = $Path -match '(?i)\.example$' -and
            $normalizedValue -match '(?i)change|replace|example|placeholder|your|strong|local|dev|defina|configure'

        if (-not ($isEmpty -or $isEnvironmentReference -or $isDocumentedPlaceholder)) {
            Add-Finding -Rule 'LiteralSensitiveAssignment' -Path $Path -Revision $Revision
        }
    }
}

Push-Location $repositoryRoot
try {
    & git -c "safe.directory=$safeDirectory" rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) {
        throw 'O diretório informado não é um repositório Git.'
    }

    $commits = @(& git -c "safe.directory=$safeDirectory" rev-list --all)
    foreach ($commit in $commits) {
        $revision = $commit.Substring(0, 7)
        $paths = @(& git -c "safe.directory=$safeDirectory" ls-tree -r --name-only $commit)

        foreach ($path in $paths) {
            if ($path -match $forbiddenPathPattern -and $path -ne '.env.example') {
                Add-Finding -Rule 'ForbiddenPath' -Path $path -Revision $revision
                continue
            }

            if ($path -match $binaryExtensionPattern) {
                continue
            }

            $content = (& git -c "safe.directory=$safeDirectory" show "$commit`:$path" 2>$null) -join "`n"
            Test-TextContent -Content $content -Path $path -Revision $revision
        }
    }

    $publishablePaths = @(& git -c "safe.directory=$safeDirectory" ls-files --cached --others --exclude-standard)
    foreach ($path in $publishablePaths) {
        if ($path -match $forbiddenPathPattern -and $path -ne '.env.example') {
            Add-Finding -Rule 'ForbiddenPath' -Path $path -Revision 'worktree'
            continue
        }

        if ($path -match $binaryExtensionPattern -or -not (Test-Path -LiteralPath $path -PathType Leaf)) {
            continue
        }

        $content = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $path))
        Test-TextContent -Content $content -Path $path -Revision 'worktree'
    }

    $uniqueFindings = @($findings | Sort-Object Rule, Revision, Path -Unique)
    if ($uniqueFindings.Count -gt 0) {
        Write-Output 'A auditoria encontrou itens que exigem revisão. Valores sensíveis não serão exibidos.'
        $uniqueFindings | Format-Table -AutoSize
        exit 1
    }

    Write-Output "Security audit passed: $($commits.Count) commit(s) and $($publishablePaths.Count) publishable file(s) checked."
} finally {
    Pop-Location
}
