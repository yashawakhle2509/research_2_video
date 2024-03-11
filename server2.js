const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { exec } = require('child_process');
const pdf = require('pdf-parse');
const gTTS = require('gtts');
const summarizer = require('nodejs-text-summarizer');

let fetch;
try {
    fetch = require('node-fetch');
} catch (err) {
    fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

const app = express();
const port = 3000;

app.use(fileUpload());
async function summarize(text, fileName) {
    // Save the original text to a file
    fs.writeFileSync(`./uploads/${fileName}_original.txt`, text);

    const options = {
        min_length: 0, // Minimum length of the summary in words
    };

    let summarizedText = '';

    // Split the text into chunks of 10 lines
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i += 10) {
        const chunk = lines.slice(i, i + 10).join('\n');
        try {
            // Summarize each chunk
            const result = summarizer(chunk, options);
            summarizedText += result;
        } catch (error) {
            console.error(`Error summarizing chunk ${i}:`, error);
        }
    }

    // Save the summarized text to a file
    fs.writeFileSync(`./uploads/${fileName}_summary.txt`, summarizedText);

    return summarizedText;
}




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

        // Summarize the text
        const summarizedText = await summarize(text);

        // Convert summarized text to speech using gTTS
        if (!summarizedText) {
            return res.status(500).send('No text to summarize.');
        }

        const audioFile = `./uploads/${pdfFile.name}_summary.mp3`;
        const gtts = new gTTS(summarizedText, 'en');
        gtts.save(audioFile, async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error generating audio.');
            }

            // Generate video based on summarized text and audio
            const fileName = 'output.mp4';
            const filePath = `./${fileName}`;

            // Use Google Custom Search API to get an image related to the text
            const imageUrl = await getImageUrl(summarizedText);
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
    const GOOGLE_API_KEY = 'YOUR_API_KEY';
    const GOOGLE_SEARCH_ENGINE_ID = 'YOUR_SEARCH_ENGINE_ID';

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
