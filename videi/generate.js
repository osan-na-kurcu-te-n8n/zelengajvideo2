const { exec } = require('child_process');
const path = require('path');

const videoPath = path.join(__dirname, 'stadium.mp4');

const inputs = [
  '-i stadium.mp4',
  '-i players/player1.gif',
  '-i players/player2.gif',
  '-i players/player3.gif',
  '-i players/player4.gif',
  '-i players/player5.gif',
  '-i players/player6.gif',
  '-i players/player7.gif',
  '-i players/player8.gif',
  '-i players/player9.gif',
  '-i players/player10.gif',
  '-i players/player11.gif'
];

const outputPath = path.join(__dirname, 'output_halfsize.mp4');

let filterComplex = '[0:v]format=rgba[bg];';

filterComplex += '[1:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player0];';
filterComplex += '[2:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player1];';
filterComplex += '[3:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player2];';
filterComplex += '[4:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player3];';
filterComplex += '[5:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player4];';
filterComplex += '[6:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player5];';
filterComplex += '[7:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player6];';
filterComplex += '[8:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player7];';
filterComplex += '[9:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player8];';
filterComplex += '[10:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player9];';
filterComplex += '[11:v]scale=iw*0.5:ih*0.5,tpad=stop_mode=clone[player10];';

filterComplex += '[bg][player0]overlay=1000:800[tmp0];';
filterComplex += '[tmp0][player1]overlay=400:600[tmp1];';
filterComplex += '[tmp1][player2]overlay=600:600[tmp2];';
filterComplex += '[tmp2][player3]overlay=800:600[tmp3];';
filterComplex += '[tmp3][player4]overlay=1000:600[tmp4];';
filterComplex += '[tmp4][player5]overlay=500:400[tmp5];';
filterComplex += '[tmp5][player6]overlay=700:400[tmp6];';
filterComplex += '[tmp6][player7]overlay=900:400[tmp7];';
filterComplex += '[tmp7][player8]overlay=400:200[tmp8];';
filterComplex += '[tmp8][player9]overlay=700:200[tmp9];';
filterComplex += '[tmp9][player10]overlay=1000:200[outv]';

const ffmpegCommand = `ffmpeg -y ${inputs.join(' ')} -filter_complex "${filterComplex}" -map "[outv]" -map 0:a? -c:a copy -pix_fmt yuv420p -c:v libx264 -shortest "${outputPath}"`.replace(/\n/g,' ');

exec(ffmpegCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('FFmpeg error:', error.message);
    console.error(stderr);
    return;
  }
  console.log('Video uspješno generiran s gifovima na 50% veličine:', outputPath);
});
