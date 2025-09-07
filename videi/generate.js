const { spawn } = require('child_process');
const path = require('path');

// Postavljamo putanju za izlaznu video datoteku
const outputPath = path.join(__dirname, 'final_video.mp4');

// Definiramo ulazne datoteke
const inputs = [
  '-i', 'all_board.mp4',     // Pozadinski video
  '-i', 'kutija.png',        // Slika kutije
  '-i', 'malaAnimacija.gif', // Mala animacija
  '-i', 'players/player1.gif', // Animacija igrača
  '-i', 'okvir.png'          // Okvirna slika
];

const filterComplex = `
  [0:v]format=rgba[bg];
  [1:v]scale=140:50,format=rgba,setpts=PTS-STARTPTS+1.5/TB[kutija];
  [bg][kutija]overlay=1080:940:enable='gte(t,1.5)'[tmp1];
  [2:v]scale=150:50,format=rgba,setpts=PTS-STARTPTS+1/TB[malaAnim];
  [tmp1][malaAnim]overlay=1070:940:enable='lt(t,4)'[tmp2];
  [3:v]scale=110:180,format=rgba,setpts=PTS-STARTPTS+2/TB[player];
  [tmp2][player]overlay=1095:760:enable='gte(t,2)'[tmp3];
  [4:v]scale=550:750,format=rgba,setpts=PTS-STARTPTS+4/TB[okvir];
  [tmp3][okvir]overlay=330:190:enable='gte(t,4)'[tmp4];
  [tmp4]null[v];  // Ovdje više nema komentara
`;

// FFmpeg argumenti za spajanje medija
const ffmpegArgs = [
  '-y', // Prepisivanje izlazne datoteke ako već postoji
  ...inputs, // Ulazni mediji
  '-filter_complex', filterComplex, // Filter za spajanje
  '-map', '[v]', // Mapiranje izlaza
  '-c:v', 'libx264', // H.264 kodek za video
  '-crf', '28', // Kvaliteta videa (manji broj znači bolja kvaliteta)
  '-preset', 'ultrafast', // Najbrže kodiranje
  '-pix_fmt', 'yuv420p', // Format boje
  outputPath // Putanja za izlaznu datoteku
];

// Pokretanje FFmpeg-a
const ffmpeg = spawn('ffmpeg', ffmpegArgs);

// Praćenje izlaza iz FFmpeg-a
ffmpeg.stdout.on('data', (data) => {
  console.log('FFmpeg stdout:', data.toString());
});

ffmpeg.stderr.on('data', (data) => {
  console.error('FFmpeg stderr:', data.toString());
});

// Provjera kada proces završi
ffmpeg.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Video je uspješno generiran:', outputPath);
  } else {
    console.error('❌ FFmpeg je završio s greškom, kod:', code);
  }
});
