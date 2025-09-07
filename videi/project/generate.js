#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

// Configuration
const CONFIG = {
    backgroundVideo: 'assets/background.mp4',
    outputVideo: 'output/lineup.mp4',
    fadeInDuration: 1.0,
    
    players: [
        { name: 'ALISSON',    x: 1060,  y: 740, img: 'assets/photos/gk.png',  start: 0 },
        { name: 'ROBERTSON',  x: 740,  y: 620, img: 'assets/photos/lb.png',  start: 2 },
        { name: 'VAN DIJK',   x: 950,  y: 635, img: 'assets/photos/lcb.png', start: 2 },
        { name: 'KONATE',     x: 1170, y: 635, img: 'assets/photos/rcb.png', start: 2 },
        { name: 'ALEXANDER-ARNOLD', x: 1390, y: 620, img: 'assets/photos/rb.png',  start: 2 },
        { name: 'FABINHO',    x: 860,  y: 410, img: 'assets/photos/lcm.png', start: 4 },
        { name: 'HENDERSON',  x: 1060,  y: 440, img: 'assets/photos/cm.png',  start: 4 },
        { name: 'THIAGO',     x: 1260, y: 410, img: 'assets/photos/rcm.png', start: 4 },
        { name: 'MANE',       x: 740,  y: 220, img: 'assets/photos/lw.png',  start: 6 },
        { name: 'SALAH',      x: 1060,  y: 200, img: 'assets/photos/st.png',  start: 6 },
        { name: 'DIAZ',       x: 1390, y: 220, img: 'assets/photos/rw.png',  start: 6 }
    ]
};

// Create output directory
fs.mkdirSync('output', { recursive: true });

// Build FFmpeg filter
let filter = '[0:v]format=rgba[bg]';
let v = '[bg]';

CONFIG.players.forEach((player, i) => {
    const imgIn = 1 + i; // Only player image input now
    
    // Scale and fade player image
    filter += `;[${imgIn}:v]scale=160:-1,format=rgba,loop=loop=300:size=1:start=0,fade=t=in:st=${player.start}:d=${CONFIG.fadeInDuration}:alpha=1[ph${i}]`;
    
    // Position elements
    const textX = player.x + 80;  // Center point of player image
    const textY = player.y + 180; // Position text below player image
    
    // Overlay player image
    filter += `;${v}[ph${i}]overlay=${player.x}:${player.y}[v${i}a]`;
    
    // Add text directly on video (no name box background)
    filter += `;[v${i}a]drawtext=fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf':text='${player.name}':fontcolor=white:fontsize=24:x='(${textX}-text_w/2)':y=${textY}:borderw=2:bordercolor=black:enable='between(t\\,${player.start}\\,999)':alpha='if(between(t\\,${player.start}\\,${player.start + CONFIG.fadeInDuration})\\,(t-${player.start})/${CONFIG.fadeInDuration}\\,1)'[v${i}b]`;
    
    v = `[v${i}b]`;
});

// FFmpeg arguments - no name box inputs needed
const args = [
    '-y', '-i', CONFIG.backgroundVideo,
    ...CONFIG.players.map(p => ['-i', p.img]).flat(),
    '-filter_complex', filter,
    '-map', `[v${CONFIG.players.length - 1}b]`,
    '-c:v', 'libx264', '-crf', '18',
    CONFIG.outputVideo
];

// Run FFmpeg
console.log('🎬 Generating soccer lineup video...');
console.log('⚽ Featured players: Liverpool FC starting XI (text overlay only)');
const ffmpeg = spawn('ffmpeg', args, { stdio: 'inherit' });

ffmpeg.on('close', (code) => {
    if (code === 0) {
        console.log(`✅ Video generated: ${CONFIG.outputVideo}`);
        console.log('🏆 Liverpool lineup complete with text overlays!');
    } else {
        console.error(`❌ FFmpeg failed with code ${code}`);
        process.exit(1);
    }
});
