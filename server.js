const express = require('express');
const path = require('path');
const app = express();
const videoGenerator = require('./videoGenerator');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/generate-video', (req, res) => {
    const text = req.query.text || req.body.text;
    videoGenerator.generateVideo(text);
    res.send('Video generation started');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
