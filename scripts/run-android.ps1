param(
  [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$androidRoot = Join-Path $projectRoot 'android'
$gradleWrapper = Join-Path $androidRoot 'gradlew.bat'
$apkPath = Join-Path $androidRoot 'app\build\outputs\apk\debug\app-debug.apk'
$logPath = Join-Path $projectRoot '.android-build.log'
$maxAttempts = 5

$env:CMAKE_BUILD_PARALLEL_LEVEL = '1'
$env:NODE_ENV = 'development'

if ($Rebuild -or !(Test-Path -LiteralPath $apkPath)) {
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt += 1) {
    Write-Host "Building Android app (attempt $attempt/$maxAttempts)..."

    Push-Location $androidRoot
    $previousErrorActionPreference = $ErrorActionPreference
    try {
      # Windows PowerShell surfaces native stderr as error records. Gradle's
      # exit code and captured log are the reliable build result.
      $ErrorActionPreference = 'Continue'
      & $gradleWrapper `
        app:assembleDebug `
        -x lint `
        -x test `
        --max-workers=1 `
        --console=plain `
        -PreactNativeDevServerPort=8081 `
        -PreactNativeArchitectures=arm64-v8a 2>&1 |
        Tee-Object -FilePath $logPath

      $buildExitCode = $LASTEXITCODE
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
      Pop-Location
    }

    if ($buildExitCode -eq 0) {
      break
    }

    $wasSecurityBlock = Select-String `
      -LiteralPath $logPath `
      -SimpleMatch 'CreateProcess: Access is denied' `
      -Quiet

    if (!$wasSecurityBlock -or $attempt -eq $maxAttempts) {
      throw "Android build failed. See $logPath"
    }

    Write-Warning 'Native compiler was temporarily blocked. Retrying from the build cache...'
  }
} else {
  Write-Host "Reusing existing development APK: $apkPath"
}

if (!(Test-Path -LiteralPath $apkPath)) {
  throw "Android APK was not created at $apkPath"
}

$adb = if ($env:ANDROID_HOME) {
  Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
} else {
  'adb'
}
$connectedDevices = @(& $adb devices) |
  Where-Object { $_ -match '\sdevice$' }

if (!$connectedDevices.Count) {
  throw 'No authorized Android device found. Connect the phone, enable USB debugging, and accept the RSA prompt.'
}

Write-Host 'Installing the APK and starting Metro...'
& npx expo run:android --binary $apkPath
exit $LASTEXITCODE
