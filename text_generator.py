from transformers import pipeline
import PyPDF2
import tkinter as tk
from tkinter import filedialog
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk import pos_tag
from moviepy.editor import *

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')

# Function to extract text from PDF
def extract_text_from_pdf(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ''
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
    except FileNotFoundError:
        print("File not found. Please provide a valid path to the PDF file.")
        return None

# Function for BERT text summarization
def bert_text_summarization(text):
    summarizer = pipeline("summarization")
    summarized_text = summarizer(text, max_length=100, min_length=30, do_sample=False)
    return summarized_text[0]['summary_text']

# Function to generate video from script
def generate_video(script):
    video_duration = 10  # Set the duration for the video (in seconds)
    txt_clip = TextClip(script, fontsize=70, color='white', bg_color='black').set_duration(video_duration)
    txt_clip = txt_clip.set_pos('center')

    # Generate video with the script text
    video = CompositeVideoClip([txt_clip])
    video.write_videofile("generated_video.mp4", fps=24)

# Function triggered upon file upload
def upload_file():
    file_path = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
    if file_path:
        pdf_text = extract_text_from_pdf(file_path)
        if pdf_text:
            summary = bert_text_summarization(pdf_text)  # Generate summarized text using BERT
            
            print("Video Script Generated:")
            print(summary)  # Output the summarized text as video script
            
            generate_video(summary)  # Generate video from the script

# Create Tkinter window
root = tk.Tk()
root.title("Video Script to Video Generator")

# Button to upload the PDF file
upload_button = tk.Button(root, text="Upload PDF", command=upload_file)
upload_button.pack()

# Text area to display instructions
instructions = tk.Label(root, text="Please upload a PDF file to generate the video.")
instructions.pack()

root.mainloop()
