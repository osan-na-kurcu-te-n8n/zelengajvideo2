const { spawn } = require('child_process');
const path = require('path');

const outputPath = path.join(__dirname, 'final_kutija_animacija.mp4');

const inputs = [
  '-i', 'videoprojekt.mp4',       // 0 - pozadina
  '-i', 'kutija.png',             // 1 - kutija
  '-i', 'malaAnimacija.gif',      // 2 - mala animacija
  '-i', 'players/player1.gif',    // 3 - player desno
  '-i', 'animacija.gif',          // 4 - velika animacija
  '-i', 'players/player1Big.gif'  // 5 - player lijevo
];

const posX = 1080;
const posY = 940;
const kutijaWidth = 150;
const kutijaHeight = 50;
const playerOffsetY = -180;
const playerWidth = 110;
const playerHeight = 180;

const leftX = -5;
const leftY = 43;
const leftXPlayer = 360;
const leftYPlayer = 260;
const bigWidth = 2000;
const bigHeight = 1000;
const bigWidthPlayer = 300;
const bigHeightPlayer = 650;

const filterComplex = `
  [0:v]format=rgba[bg];

  [1:v]scale=${kutijaWidth - 10}:${kutijaHeight},format=rgba,setpts=PTS-STARTPTS+1.5/TB[kutija];
  [bg][kutija]overlay=${posX}:${posY}:enable='gte(t,1.5)'[tmp1];

  [2:v]scale=${kutijaWidth}:${kutijaHeight},format=rgba,setpts=PTS-STARTPTS+1/TB,fade=t=in:st=1:d=1[malaAnim];
  [tmp1][malaAnim]overlay=${posX - 10}:${posY}:enable='lt(t,4)'[tmp2];

  [3:v]scale=${playerWidth}:${playerHeight},format=rgba,setpts=PTS-STARTPTS+2/TB,fade=t=in:st=2:d=0.5[player];
  [tmp2][player]overlay=${posX + 15}:${posY + playerOffsetY}:enable='gte(t,2)'[tmp3];

  [5:v]scale=${bigWidthPlayer}:${bigHeightPlayer},format=rgba,fade=t=in:st=1:d=0.5,setpts=PTS-STARTPTS+0.5/TB[playerBig];
  [tmp3][playerBig]overlay=${leftXPlayer}:${leftYPlayer}:enable='gte(t,1)'[tmp4];

  [tmp4]drawtext=text='Ivan Kvesić':fontcolor=white:fontsize=50:x=${leftXPlayer - 20}:y=${leftYPlayer - 60}:enable='gte(t,1.5)':alpha='if(lt(t,2.5),(t-1.5)/1,1)'[tmpName];
  [tmpName]drawtext=text='Napadač':fontcolor=white:fontsize=45:x=${leftXPlayer + 10}:y=${leftYPlayer + bigHeightPlayer - 10}:enable='gte(t,1.5)':alpha='if(lt(t,2.5),(t-1.5)/1,1)'[tmpPosition];
  [tmpPosition]drawtext=text='9':fontcolor=green:fontsize=70:fontfile='C\\:/Windows/Fonts/arial.ttf':borderw=4:bordercolor=black:x=${leftXPlayer + bigWidthPlayer / 2 - 20}:y=${leftYPlayer + bigHeightPlayer / 2 - 35}:enable='gte(t,1.5)':alpha='if(lt(t,2.5),(t-1.5)/1,1)'[tmpText];

  [4:v]scale=${bigWidth}:${bigHeight},format=rgba,setpts=PTS-STARTPTS+1/TB,fade=t=out:st=3:d=1[bigAnim];
  [tmpText][bigAnim]overlay=${leftX}:${leftY}:enable='lt(t,4)'[tmp5];

  [tmp5]drawtext=text='Kvesić':fontcolor=green:fontsize=35:x=${posX + 15}:y=${posY + 10}:enable='gte(t,2)':alpha='if(lt(t,2.5),(t-2)/1,1)'[outv];
`;

const ffmpegArgs = [
  '-y',
  ...inputs,
  '-filter_complex', filterComplex,
  '-map', '[outv]',
  '-map', '0:a?',
  '-c:a', 'copy',
  '-pix_fmt', 'yuv420p',
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-crf', '28',
  '-shortest',
  outputPath
];

const ffmpeg = spawn('ffmpeg', ffmpegArgs);

ffmpeg.stdout.on('data', data => process.stdout.write(data));
ffmpeg.stderr.on('data', data => process.stderr.write(data));
ffmpeg.on('close', code => {
  if (code === 0) {
    console.log('\n✅ Finalni video generiran:', outputPath);
  } else {
    console.error(`\n❌ FFmpeg završio s kodom greške ${code}`);
  }
});
