document.getElementById('generateBtn').addEventListener('click', async () => {
    const textInput = document.getElementById('textInput').value;

    const response = await fetch('/generate-video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textInput })
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById('videoPlayer').src = data.videoUrl;
    } else {
        console.error('Failed to generate video');
    }
});
