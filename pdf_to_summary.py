import tkinter as tk
from tkinter import filedialog
from transformers import pipeline
import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text += page.get_text()

    return text

def generate_summary(pdf_text):
    summarizer = pipeline("summarization")
    summary = summarizer(pdf_text, max_length=1500, min_length=500, length_penalty=2.0, num_beams=4, early_stopping=True)
    return summary[0]['summary_text']

def upload_pdf():
    file_path = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
    
    if file_path:
        pdf_text = extract_text_from_pdf(file_path)
        summary_text = generate_summary(pdf_text)
        result_text.config(state=tk.NORMAL)
        result_text.delete("1.0", tk.END)
        result_text.insert(tk.END, summary_text)
        result_text.config(state=tk.DISABLED)

# Create the main window
window = tk.Tk()
window.title("PDF Summary Generator")

# Create and configure the UI elements
upload_button = tk.Button(window, text="Upload PDF", command=upload_pdf)
upload_button.pack(pady=10)

result_text = tk.Text(window, height=10, width=50, wrap=tk.WORD, state=tk.DISABLED)
result_text.pack(pady=10)

# Start the main loop
window.mainloop()

