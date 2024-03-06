const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { exec } = require('child_process');
const pdf = require('pdf-parse');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const port = 3000;

app.use(fileUpload());

app.post('/upload', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const pdfFile = req.files.pdfFile;

    pdfFile.mv('./uploads/' + pdfFile.name, async (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        // Read the PDF file
        const dataBuffer = fs.readFileSync('./uploads/' + pdfFile.name);
        const data = await pdf(dataBuffer);

        // Extract text from PDF
        const text = data.text;

        // Convert text to speech
        const textFilePath = `./uploads/${pdfFile.name}.txt`;
	fs.writeFileSync(textFilePath, text);
	const audioFile = `./uploads/${pdfFile.name}.mp3`;
	const textToSpeechCommand = `espeak -w ${audioFile} -f ${textFilePath}`;

	exec(textToSpeechCommand, async (err, stdout, stderr) => {
    	if (err) {
        	console.error(err);
        	return res.status(500).send('Error generating audio.');
    		}
            // Generate video based on text and audio
            const fileName = 'output.mp4';
            const filePath = `./${fileName}`;

            // Use Google Custom Search API to get an image related to the text
            const imageUrl = await getImageUrl(text);
            if (!imageUrl) {
                return res.status(500).send('No image found for the given text.');
            }

            // Download the image
            const imageResponse = await fetch(imageUrl);
            const imageData = await imageResponse.buffer();

            // Save the image to a file
            fs.writeFileSync('./temp.jpg', imageData);

            // FFmpeg command to create a video from the image and audio
            const command = `ffmpeg -loop 1 -i temp.jpg -i ${audioFile} -c:v libx264 -t 5 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:a aac -strict experimental -shortest ${filePath}`;

            exec(command, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error generating video.');
                }
                console.log('Video generated successfully:', fileName);
                res.sendFile(filePath);
            });
        });
    });
});

async function getImageUrl(query) {
    const GOOGLE_API_KEY = 'AIzaSyCqJVZY09fdFM0jO4k25SMdeqhd9Fc3Ckk';
    const GOOGLE_SEARCH_ENGINE_ID = '6501ef91d6ba1409e';

    const url = `https://www.googleapis.com/customsearch/v1?q=${query}&cx=${GOOGLE_SEARCH_ENGINE_ID}&key=${GOOGLE_API_KEY}&searchType=image&num=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
        return data.items[0].link;
    }
    return null;
}

app.get('/', (req, res) => {
    res.send('Hello, welcome to the PDF to Video converter.');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
