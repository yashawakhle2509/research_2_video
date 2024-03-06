const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateVideo(text) {
  const fileName = 'output.mp4';
  const filePath = `./${fileName}`;

  // Create a temporary text file
  fs.writeFileSync('./temp.txt', text);

  // FFmpeg command to create a video from the text file
  const command = `ffmpeg -f lavfi -i color=c=blue:s=320x240:d=5 -vf drawtext="fontfile=/path/to/font.ttf:fontsize=30:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:textfile=temp.txt" -y ${filePath}`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Video generated successfully:', fileName);
    fs.unlinkSync('./temp.txt'); // Remove temporary text file
  });
}

rl.question('Enter the text for the video: ', (text) => {
  generateVideo(text);
  rl.close();
});
