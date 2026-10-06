const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// 2869 is Mixkit "Pleasant notification alert" / cheerful melodic chime
// 2870 is "Sweet notification ding"
// 2358 is "Positive interface notification chime"
// 2868 is "Playful game notification"
const soundUrls = [
  { name: 'refresh_chime.mp3', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { name: 'swiggy_tune.mp3', url: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' },
  { name: 'ding_chime.mp3', url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3' },
];

async function downloadAll() {
  for (const item of soundUrls) {
    try {
      console.log(`Downloading ${item.name} from ${item.url}...`);
      const res = await fetch(item.url);
      if (!res.ok) {
        console.error(`Failed to download ${item.name}: ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const dest = path.join(soundsDir, item.name);
      fs.writeFileSync(dest, buffer);
      console.log(`Saved ${item.name} (${buffer.length} bytes) to ${dest}`);
    } catch (e) {
      console.error(`Error downloading ${item.name}:`, e.message);
    }
  }
}

downloadAll();
