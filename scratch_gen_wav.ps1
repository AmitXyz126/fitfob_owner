$sampleRate = 22050
$duration = 0.30
$numSamples = [int]($sampleRate * $duration)
$dataBytes = $numSamples * 2
$totalBytes = 44 + $dataBytes

$bytes = New-Object byte[] $totalBytes

# RIFF Header
[System.Text.Encoding]::ASCII.GetBytes("RIFF").CopyTo($bytes, 0)
[System.BitConverter]::GetBytes([int]($totalBytes - 8)).CopyTo($bytes, 4)
[System.Text.Encoding]::ASCII.GetBytes("WAVEfmt ").CopyTo($bytes, 8)
[System.BitConverter]::GetBytes([int]16).CopyTo($bytes, 16)
[System.BitConverter]::GetBytes([int16]1).CopyTo($bytes, 20)      # PCM
[System.BitConverter]::GetBytes([int16]1).CopyTo($bytes, 22)      # Mono
[System.BitConverter]::GetBytes([int]$sampleRate).CopyTo($bytes, 24)
[System.BitConverter]::GetBytes([int]($sampleRate * 2)).CopyTo($bytes, 28)
[System.BitConverter]::GetBytes([int16]2).CopyTo($bytes, 32)
[System.BitConverter]::GetBytes([int16]16).CopyTo($bytes, 34)
[System.Text.Encoding]::ASCII.GetBytes("data").CopyTo($bytes, 36)
[System.BitConverter]::GetBytes([int]$dataBytes).CopyTo($bytes, 40)

$rand = New-Object System.Random
$phase = 0.0

for ($i = 0; $i -lt $numSamples; $i++) {
    $t = [double]$i / [double]$sampleRate
    
    # Pitch drops from 500 Hz down to 60 Hz (whoosh / crumple)
    $freq = 500.0 * [Math]::Exp(-$t * 12.0) + 60.0
    $phase += 2.0 * [Math]::PI * $freq / $sampleRate
    $tone = [Math]::Sin($phase) * 0.4
    
    # White noise (crumple / rustle)
    $noise = ($rand.NextDouble() * 2.0 - 1.0) * 0.4
    
    # Low pop / thump at t ~ 0.03s
    $thump = [Math]::Sin(2.0 * [Math]::PI * 65.0 * $t) * [Math]::Exp(-[Math]::Pow(($t - 0.03) * 45.0, 2)) * 0.5
    
    # Decay envelope
    $env = 1.0
    if ($t -lt 0.01) {
        $env = $t / 0.01
    } else {
        $env = [Math]::Exp(-($t - 0.01) * 11.0)
    }
    
    $s = ($tone + $noise + $thump) * $env
    if ($s -gt 1.0) { $s = 1.0 }
    if ($s -lt -1.0) { $s = -1.0 }
    
    $val = [int16]($s * 28000.0)
    $sampleBytes = [System.BitConverter]::GetBytes($val)
    $bytes[44 + $i * 2] = $sampleBytes[0]
    $bytes[44 + $i * 2 + 1] = $sampleBytes[1]
}

[System.IO.File]::WriteAllBytes("assets/sounds/trash_delete.wav", $bytes)
Write-Output "SUCCESS: assets/sounds/trash_delete.wav written. Size: $totalBytes bytes"
