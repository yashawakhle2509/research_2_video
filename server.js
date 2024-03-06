const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());

app.post('/generate-video', async (req, res) => {
    const text = req.body.text;
    const filename = 'output.mp4'; // Output video filename

    // Execute FFmpeg command to create video
    exec(`ffmpeg -f lavfi -i color=c=blue:s=640x480:d=5 -vf drawtext=text="${text}":fontfile=Arial.ttf:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2 -y ${filename}`, (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to generate video' });
            return;
        }
        res.json({ videoUrl: `${req.protocol}://${req.get('host')}/${filename}` });
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
