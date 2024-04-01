from flask import Flask, render_template, request
from transformers import pipeline
import os
from gtts import gTTS
from PyPDF2 import PdfReader

app = Flask(__name__)

# Define the summarization pipeline using the facebook/bart-large-cnn model
summarizer = pipeline("summarization", model="pszemraj/long-t5-tglobal-base-16384-book-summary")

@app.route("/", methods=["GET", "POST"])
def home():
    if request.method == "POST":
        if "pdf_file" not in request.files:
            return render_template("index2.html", error="No file part")

        pdf_file = request.files["pdf_file"]
        if pdf_file.filename == "":
            return render_template("index2.html", error="No selected file")

        if pdf_file:
            # Save the uploaded PDF file
            pdf_path = os.path.join("uploads", pdf_file.filename)
            pdf_file.save(pdf_path)

            # Extract text from the PDF
            text = extract_text_from_pdf(pdf_path)

            # Summarize the extracted text
            summary = summarize_text(text)

            # Generate audio from the summary
            audio_path = generate_audio(summary, pdf_file.filename)

            return render_template("index2.html", summary=summary, audio_path=audio_path)

    return render_template("index2.html")

def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        pdf_reader = PdfReader(file)
        text = ''
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text()
    return text

def summarize_text(text):
    # Split the text into chunks of 200 words
    chunks = [text[i:i + 1000] for i in range(0, len(text), 1000)]
    summary = ""
    for chunk in chunks:
        summary += summarizer(chunk, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]
    return summary

def generate_audio(text, filename):
    audio_path = os.path.join("uploads", filename.replace(".pdf", "_summary.mp3"))
    tts = gTTS(text=text, lang="en")
    tts.save(audio_path)
    return audio_path

if __name__ == "__main__":
    app.run(debug=True)
