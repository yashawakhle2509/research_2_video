const readlineSync = require('readline-sync');
const { exec } = require('child_process');
const fs = require('fs');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Google Custom Search API key and search engine ID
const GOOGLE_API_KEY = 'AIzaSyCqJVZY09fdFM0jO4k25SMdeqhd9Fc3Ckk';
const GOOGLE_SEARCH_ENGINE_ID = '6501ef91d6ba1409e';

async function getImageUrl(query) {
    const url = `https://www.googleapis.com/customsearch/v1?q=${query}&cx=${GOOGLE_SEARCH_ENGINE_ID}&key=${GOOGLE_API_KEY}&searchType=image&num=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
        return data.items[0].link;
    }
    return null;
}
async function generateVideo(text) {
    const imageUrl = await getImageUrl(text);
    if (!imageUrl) {
        console.error('No image found for the given text.');
        return;
    }

    const fileName = 'output.mp4';
    const filePath = `./${fileName}`;

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageData = await imageResponse.buffer();

    // Save the image to a file
    fs.writeFileSync('./temp.jpg', imageData);

    // FFmpeg command to create a video from the image
    const command = `ffmpeg -loop 1 -i temp.jpg -c:v libx264 -t 5 -pix_fmt yuv420p ${filePath}`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Video generated successfully:', fileName);
        fs.unlinkSync('./temp.jpg'); // Remove temporary image file
    });
}

const text = readlineSync.question('Enter the text for the video: ');
generateVideo(text);
