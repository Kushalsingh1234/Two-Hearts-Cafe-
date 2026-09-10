import fs from 'fs';

// Generate 44.1kHz 16-bit mono PCM WAV for crystal-clear cafe bell chime
const sampleRate = 44100;
const durationSeconds = 1.8;
const totalSamples = Math.floor(sampleRate * durationSeconds);

const buffer = Buffer.alloc(44 + totalSamples * 2);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + totalSamples * 2, 4);
buffer.write('WAVE', 8);

// fmt subchunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
buffer.writeUInt16LE(1, 22); // num channels (1 = mono)
buffer.writeUInt32LE(sampleRate, 24); // sample rate
buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * numChannels * bitsPerSample/8)
buffer.writeUInt16LE(2, 32); // block align
buffer.writeUInt16LE(16, 34); // bits per sample

// data subchunk
buffer.write('data', 36);
buffer.writeUInt32LE(totalSamples * 2, 40);

// Bell synthesis: Strike tone (1318.5 Hz, E6) + harmonic overtones
for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  
  // Exponential decay
  const env = Math.exp(-t * 3.5);
  const strikeEnv = Math.exp(-t * 22.0); // sharp initial tap/ting

  // Frequencies: Fundamental (1318.5 Hz), Overtones (2093 Hz, 2637 Hz, 3135 Hz)
  const f1 = 1318.5; // E6
  const f2 = 2093.0; // C7
  const f3 = 2637.0; // E7
  const fStrike = 3951.0; // B7 high metallic ping

  const sample =
    0.55 * Math.sin(2 * Math.PI * f1 * t) * env +
    0.28 * Math.sin(2 * Math.PI * f2 * t) * Math.exp(-t * 4.5) +
    0.18 * Math.sin(2 * Math.PI * f3 * t) * Math.exp(-t * 6.0) +
    0.25 * Math.sin(2 * Math.PI * fStrike * t) * strikeEnv;

  const intSample = Math.max(-32767, Math.min(32767, Math.floor(sample * 26000)));
  buffer.writeInt16LE(intSample, 44 + i * 2);
}

fs.writeFileSync('public/audio/ting.wav', buffer);
fs.writeFileSync('public/audio/ting.mp3', buffer); // Fallback copy for .mp3 references
console.log('Bell chime generated successfully at public/audio/ting.wav and public/audio/ting.mp3');
