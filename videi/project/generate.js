// generate.js
// Compose a soccer lineup by duplicating a reusable "player object" (GIF + name-box + drawtext)
// Requirements: ffmpeg on PATH (Linux), Node.js 16+
// Assets expected relative to project root; adjust as needed.

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const config = {
  background: 'assets/background.mp4',
  nameBoxPng: 'assets/name-box.png',
  fontFile: 'assets/fonts/DejaVuSans.ttf',
  outFile: 'output/lineup.mp4',
  vCodec: 'libx264',
  pixFmt: 'yuv420p',
  crf: '18',
  preset: 'medium',
  textStyle: {
    fontcolor: 'white',
    fontsize: 36,
    shadowcolor: 'black',
    shadowx: 2,
    shadowy: 2,
  }
};

// Example lineup with per-player GIFs (set gifPath for each)
const lineup = [
  { name: 'GK Name',  x: 640,  y: 900, gifPath: 'assets/gifs/gk.gif' },
  { name: 'LB Name',  x: 260,  y: 760, gifPath: 'assets/gifs/lb.gif' },
  { name: 'LCB Name', x: 480,  y: 780, gifPath: 'assets/gifs/lcb.gif' },
  { name: 'RCB Name', x: 800,  y: 780, gifPath: 'assets/gifs/rcb.gif' },
  { name: 'RB Name',  x: 1020, y: 760, gifPath: 'assets/gifs/rb.gif' },
  { name: 'LCM Name', x: 460,  y: 600, gifPath: 'assets/gifs/lcm.gif' },
  { name: 'CM Name',  x: 640,  y: 560, gifPath: 'assets/gifs/cm.gif' },
  { name: 'RCM Name', x: 820,  y: 600, gifPath: 'assets/gifs/rcm.gif' },
  { name: 'LW Name',  x: 360,  y: 360, gifPath: 'assets/gifs/lw.gif' },
  { name: 'ST Name',  x: 640,  y: 300, gifPath: 'assets/gifs/st.gif' },
  { name: 'RW Name',  x: 920,  y: 360, gifPath: 'assets/gifs/rw.gif' },
];

// Ensure output folder exists
fs.mkdirSync(path.dirname(config.outFile), { recursive: true });

// Minimal escaping for drawtext text in filtergraph context
function escapeDrawtextText(t) {
  return String(t)
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\\\'")
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/;/g, '\\;');
}

// Build filter_complex dynamically
function buildFilterGraph(players) {
  const prelabels = [];
  // For i-th player, name box input index = 1 + i*2, gif input index = 2 + i*2
  players.forEach((_, i) => {
    const boxIn = 1 + i * 2;
    const gifIn = 2 + i * 2;
    // Normalize to RGBA so overlay blends alpha correctly
    prelabels.push(`[${boxIn}:v]format=rgba[box${i}]`);
    prelabels.push(`[${gifIn}:v]format=rgba[gif${i}]`);
  });

  const parts = [];
  let videoLabel = '[bgv]';

  players.forEach((p, i) => {
    const boxX = Math.floor(p.x - 100); // adjust based on box width
    const boxY = Math.floor(p.y + 80);  // under the player GIF
    const textX = boxX + 10;
    const textY = boxY + 10;
    const nameText = escapeDrawtextText(p.name);
    const ts = config.textStyle;

    // Overlay name box
    parts.push(`${videoLabel}[box${i}]overlay=${boxX}:${boxY}:format=auto[v${i}_box]`);
    // Draw name on top of the box
    parts.push(`[v${i}_box]drawtext=fontfile=${config.fontFile}:text='${nameText}':fontcolor=${ts.fontcolor}:fontsize=${ts.fontsize}:shadowcolor=${ts.shadowcolor}:shadowx=${ts.shadowx}:shadowy=${ts.shadowy}:x=${textX}:y=${textY}[v${i}_text]`);
    // Overlay the player's GIF
    parts.push(`[v${i}_text][gif${i}]overlay=${p.x}:${p.y}:shortest=1:format=auto[v${i}_gif]`);

    videoLabel = `[v${i}_gif]`;
  });

  const filter = [
    `[0:v]format=rgba[bgv]`,
    ...prelabels,
    ...parts
  ].join(',');

  return { filter, lastVideoLabel: videoLabel };
}

// Build inputs: background, then for each player: name-box.png, that player's GIF
function buildInputs(players) {
  const args = [['-i', config.background]];
  players.forEach((p) => {
    args.push(['-i', config.nameBoxPng]);
    // Ensure -ignore_loop 0 precedes the GIF's -i so FFmpeg honors GIF loop metadata
    args.push(['-ignore_loop', '0', '-i', p.gifPath]);
  });
  return args.flat();
}

function run(players) {
  const { filter, lastVideoLabel } = buildFilterGraph(players);
  const args = [
    ...buildInputs(players),
    '-filter_complex', filter,
    '-map', lastVideoLabel,
    '-c:v', config.vCodec,
    '-pix_fmt', config.pixFmt,
    '-crf', config.crf,
    '-preset', config.preset,
    '-movflags', '+faststart',
    config.outFile
  ];

  console.log('Running ffmpeg with args:\n', args.join(' '));
  const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  ff.stdout.on('data', (d) => process.stdout.write(d));
  ff.stderr.on('data', (d) => process.stderr.write(d));
  ff.on('close', (code) => {
    if (code === 0) {
      console.log('Lineup video created:', config.outFile);
    } else {
      console.error('ffmpeg exited with code', code);
    }
  });
}

// Validate input assets
(function validate() {
  const need = ['background', 'nameBoxPng', 'fontFile'];
  need.forEach((k) => {
    const pth = config[k];
    if (!fs.existsSync(pth)) {
      console.error(`Missing required asset: ${pth}`);
      process.exit(1);
    }
  });
  lineup.forEach((p, i) => {
    if (!p.gifPath || !fs.existsSync(p.gifPath)) {
      console.error(`Missing or invalid gifPath for player index ${i}: ${p.gifPath}`);
      process.exit(1);
    }
  });
})();

run(lineup);
