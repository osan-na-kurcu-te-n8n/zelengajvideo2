// generate.js
// Lineup with timed entrances and fade-in on GIF, name-box, and text

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

  offsetX: 600,

  // Scale overlays (preserve aspect by width)
  gifScale: { w: 160, h: -1, flags: 'lanczos' },

  // Fade duration in seconds for all elements
  fadeDur: 0.6, // FADE duration [9]

  textStyle: {
    fontcolor: 'white',
    fontsize: 36,
    shadowcolor: 'black',
    shadowx: 2,
    shadowy: 2,
  }
};

// Timed lineup groups: 0s GK, 2s back four, 4s mids, 6s forwards
const lineup = [
  { key: 'gk',  name: 'GK Name',  x: 640,  y: 900, gifPath: 'assets/gifs/gk.gif',  startTime: 0 },
  { key: 'lb',  name: 'LB Name',  x: 260,  y: 760, gifPath: 'assets/gifs/lb.gif',  startTime: 2 },
  { key: 'lcb', name: 'LCB Name', x: 480,  y: 780, gifPath: 'assets/gifs/lcb.gif', startTime: 2 },
  { key: 'rcb', name: 'RCB Name', x: 800,  y: 780, gifPath: 'assets/gifs/rcb.gif', startTime: 2 },
  { key: 'rb',  name: 'RB Name',  x: 1020, y: 760, gifPath: 'assets/gifs/rb.gif',  startTime: 2 },
  { key: 'lcm', name: 'LCM Name', x: 460,  y: 600, gifPath: 'assets/gifs/lcm.gif', startTime: 4 },
  { key: 'cm',  name: 'CM Name',  x: 640,  y: 560, gifPath: 'assets/gifs/cm.gif',  startTime: 4 },
  { key: 'rcm', name: 'RCM Name', x: 820,  y: 600, gifPath: 'assets/gifs/rcm.gif', startTime: 4 },
  { key: 'lw',  name: 'LW Name',  x: 360,  y: 360, gifPath: 'assets/gifs/lw.gif',  startTime: 6 },
  { key: 'st',  name: 'ST Name',  x: 640,  y: 300, gifPath: 'assets/gifs/st.gif',  startTime: 6 },
  { key: 'rw',  name: 'RW Name',  x: 920,  y: 360, gifPath: 'assets/gifs/rw.gif',  startTime: 6 },
];

fs.mkdirSync(path.dirname(config.outFile), { recursive: true });

// Escape drawtext text for filtergraph
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

// Build filter_complex with scaling, timed enables, and alpha fades
function buildFilterGraph(players) {
  const prelabels = [];
  players.forEach((p, i) => {
    const boxIn = 1 + i * 2;
    const gifIn = 2 + i * 2;

    // Name-box: RGBA then fade-in alpha starting at p.startTime
    // Use a minor chain label [box{i}f] for faded box
    prelabels.push(
      `[${boxIn}:v]format=rgba,fade=in:st=${p.startTime}:d=${config.fadeDur}:alpha=1[box${i}f]`
    ); // FADE on name-box [1][9]

    // GIF: RGBA -> scale -> fade-in alpha starting at p.startTime
    const { w, h, flags } = config.gifScale;
    prelabels.push(
      `[${gifIn}:v]format=rgba,scale=${w}:${h}${flags ? `:flags=${flags}` : ''},` +
      `fade=in:st=${p.startTime}:d=${config.fadeDur}:alpha=1[gif${i}f]`
    ); // FADE on GIF [9][2]
  });

  const parts = [];
  let videoLabel = '[bgv]';

  players.forEach((p, i) => {
    const xShift = config.offsetX || 0;

    const boxX = Math.floor(p.x - 100 + xShift);
    const boxY = Math.floor(p.y + 80);
    const textX = boxX + 10;
    const textY = boxY + 10;

    const nameText = escapeDrawtextText(p.name);
    const ts = config.textStyle;

    // Enable from player's start time onward
    const en = `enable='between(t,${p.startTime},1e9)'`;

    // 1) Overlay faded name-box
    parts.push(`${videoLabel}[box${i}f]overlay=${boxX}:${boxY}:format=auto:${en}[v${i}_box]`); // [1][2]

    // 2) Drawtext with alpha expression for fade-in synced to startTime
    const alphaExpr = `alpha='if(lt(t,${p.startTime}),0,if(lt(t,${p.startTime}+${config.fadeDur}),(t-${p.startTime})/${config.fadeDur},1))'`; // FADE text [13]
    parts.push(
      `[v${i}_box]drawtext=fontfile=${config.fontFile}:text='${nameText}':fontcolor=${ts.fontcolor}:fontsize=${ts.fontsize}:shadowcolor=${ts.shadowcolor}:shadowx=${ts.shadowx}:shadowy=${ts.shadowy}:x=${textX}:y=${textY}:${alphaExpr}:${en}[v${i}_text]`
    ); // [13][2]

    // 3) Overlay faded GIF
    parts.push(
      `[v${i}_text][gif${i}f]overlay=${p.x + xShift}:${p.y}:shortest=1:format=auto:${en}[v${i}_gif]`
    ); // [9][2]

    videoLabel = `[v${i}_gif]`;
  });

  const filter = [
    `[0:v]format=rgba[bgv]`,
    ...prelabels,
    ...parts
  ].join(',');

  return { filter, lastVideoLabel: videoLabel };
}

// Inputs: background, then for each player: name-box.png, that player's GIF
function buildInputs(players) {
  const args = [['-y'], ['-i', config.background]];
  players.forEach((p) => {
    args.push(['-i', config.nameBoxPng]);
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

// Validate inputs
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
