const { exec } = require('child_process');
const path = require('path');

// Paths
const videoPath = path.join(__dirname, 'stadium.mp4');
const pitchPath = path.join(__dirname, 'pitch.png');
const playerGif = path.join(__dirname, 'players', 'player1.gif');
const outputPath = path.join(__dirname, 'output.mp4');

// Podesite fontfile na stvarni path Arial.ttf na vašem sustavu!
const fontFile = "C\\:/Windows/Fonts/arial.ttf";

// FFmpeg filter - drawtext centriran i iznad donjeg ruba svakog GIF sloja
const ffmpegCommand = `
ffmpeg -y \
-i "${videoPath}" \
-i "${pitchPath}" \
-i "${playerGif}" -i "${playerGif}" -i "${playerGif}" -i "${playerGif}" -i "${playerGif}" \
-i "${playerGif}" -i "${playerGif}" -i "${playerGif}" -i "${playerGif}" -i "${playerGif}" -i "${playerGif}" \
-filter_complex "
[0:v][1:v]overlay=(W-w)/2:(H-h)/2[bg0];
[2:v]scale=200:400[p0];[p0]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p0t];[bg0][p0t]overlay=900:50[tmp0];
[3:v]scale=200:400,setpts=PTS+3/TB[p1];[p1]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p1t];[tmp0][p1t]overlay=400:200[tmp1];
[4:v]scale=200:400,setpts=PTS+4/TB[p2];[p2]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p2t];[tmp1][p2t]overlay=700:200[tmp2];
[5:v]scale=200:400,setpts=PTS+5/TB[p3];[p3]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p3t];[tmp2][p3t]overlay=1000:200[tmp3];
[6:v]scale=200:400,setpts=PTS+6/TB[p4];[p4]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p4t];[tmp3][p4t]overlay=1300:200[tmp4];
[7:v]scale=200:400,setpts=PTS+7/TB[p5];[p5]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p5t];[tmp4][p5t]overlay=600:400[tmp5];
[8:v]scale=200:400,setpts=PTS+8/TB[p6];[p6]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p6t];[tmp5][p6t]overlay=900:300[tmp6];
[9:v]scale=200:400,setpts=PTS+9/TB[p7];[p7]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p7t];[tmp6][p7t]overlay=1200:400[tmp7];
[10:v]scale=200:400,setpts=PTS+10/TB[p8];[p8]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p8t];[tmp7][p8t]overlay=400:500[tmp8];
[11:v]scale=200:400,setpts=PTS+11/TB[p9];[p9]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p9t];[tmp8][p9t]overlay=900:600[tmp9];
[12:v]scale=200:400,setpts=PTS+12/TB[p10];[p10]drawtext=fontfile='${fontFile}':text='1 Kvesić':x=(w-tw)/2:y=h-th-10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black[p10t];[tmp9][p10t]overlay=1300:500[outv]
" -map "[outv]" -c:v libx264 -pix_fmt yuv420p -shortest "${outputPath}"
`.replace(/\n/g, ' ');

// Run FFmpeg
exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
        console.error('Error:', error.message);
        console.error('FFmpeg stderr:', stderr);
        return;
    }
    console.log('Video generated successfully:', outputPath);
});
