$sampleRate = 44100
$duration = 0.22
$numSamples = [int]($sampleRate * $duration)
$dataBytes = $numSamples * 2
$totalBytes = 44 + $dataBytes

$bytes = New-Object byte[] $totalBytes

# RIFF Header
[System.Text.Encoding]::ASCII.GetBytes("RIFF").CopyTo($bytes, 0)
[System.BitConverter]::GetBytes([int]($totalBytes - 8)).CopyTo($bytes, 4)
[System.Text.Encoding]::ASCII.GetBytes("WAVEfmt ").CopyTo($bytes, 8)
[System.BitConverter]::GetBytes([int]16).CopyTo($bytes, 16)
[System.BitConverter]::GetBytes([int16]1).CopyTo($bytes, 20)           # PCM
[System.BitConverter]::GetBytes([int16]1).CopyTo($bytes, 22)           # Mono
[System.BitConverter]::GetBytes([int]$sampleRate).CopyTo($bytes, 24)
[System.BitConverter]::GetBytes([int]($sampleRate * 2)).CopyTo($bytes, 28)
[System.BitConverter]::GetBytes([int16]2).CopyTo($bytes, 32)
[System.BitConverter]::GetBytes([int16]16).CopyTo($bytes, 34)
[System.Text.Encoding]::ASCII.GetBytes("data").CopyTo($bytes, 36)
[System.BitConverter]::GetBytes([int]$dataBytes).CopyTo($bytes, 40)

$rand = New-Object System.Random
$phase = 0.0
$lpNoise = 0.0

# Low-pass filter for soft air puff (cutoff ~ 500 Hz)
$cutoff = 500.0
$dt = 1.0 / $sampleRate
$rc = 1.0 / (2.0 * [Math]::PI * $cutoff)
$alpha = $dt / ($rc + $dt)

for ($i = 0; $i -lt $numSamples; $i++) {
    $t = [double]$i / [double]$sampleRate
    
    # 1. Warm glide tone: drops smoothly from 240 Hz to 75 Hz
    $freq = 165.0 * [Math]::Exp(-$t * 18.0) + 75.0
    $phase += 2.0 * [Math]::PI * $freq / $sampleRate
    # Warm tone (fundamental + soft 2nd harmonic)
    $tone = [Math]::Sin($phase) * 0.55 + [Math]::Sin($phase * 2.0) * 0.12
    
    # 2. Silky filtered air puff (zero harsh white noise / static)
    $rawNoise = ($rand.NextDouble() * 2.0 - 1.0)
    $lpNoise += $alpha * ($rawNoise - $lpNoise)
    $noiseEnv = [Math]::Exp(-$t * 22.0) * 0.20
    $air = $lpNoise * $noiseEnv
    
    # 3. Soft tactile pop (gentle low-frequency tap under 40ms)
    $pop = [Math]::Sin(2.0 * [Math]::PI * 80.0 * $t) * [Math]::Exp(-[Math]::Pow(($t - 0.015) * 70.0, 2)) * 0.22
    
    # Master Envelope: 8ms smooth raised-cosine attack (avoids click) + smooth natural decay
    $masterEnv = 0.0
    $attack = 0.008
    if ($t -lt $attack) {
        $masterEnv = 0.5 * (1.0 - [Math]::Cos([Math]::PI * $t / $attack))
    } else {
        $masterEnv = [Math]::Exp(-($t - $attack) * 15.0)
    }
    
    $sample = ($tone + $air + $pop) * $masterEnv
    
    # Soft limiter
    if ($sample -gt 0.85) { $sample = 0.85 }
    if ($sample -lt -0.85) { $sample = -0.85 }
    
    $val = [int16]($sample * 25000.0)
    $sampleBytes = [System.BitConverter]::GetBytes($val)
    $bytes[44 + $i * 2] = $sampleBytes[0]
    $bytes[44 + $i * 2 + 1] = $sampleBytes[1]
}

[System.IO.File]::WriteAllBytes("assets/sounds/trash_delete.wav", $bytes)
Write-Output "SUCCESS: Smooth trash_delete.wav generated. Size: $totalBytes bytes"
