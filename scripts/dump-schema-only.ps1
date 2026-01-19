param(
  [Parameter(Mandatory = $false)]
  [string]$OutFile = "schema_only.sql"
)

$ErrorActionPreference = "Stop"

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) { $dbUrl = $env:SUPABASE_DB_URL }

if (-not $dbUrl) {
  Write-Error "Missing DATABASE_URL (or SUPABASE_DB_URL). Set it, then rerun."
  exit 1
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  Write-Error "pg_dump not found on PATH. Install PostgreSQL client tools, then rerun."
  exit 1
}

Write-Host "Dumping schema to $OutFile ..."

& $pgDump.Source `
  --schema-only `
  --no-owner `
  --no-privileges `
  --file $OutFile `
  --dbname $dbUrl

Write-Host "Done."
