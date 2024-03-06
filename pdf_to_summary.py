import tkinter as tk
from tkinter import filedialog
from transformers import TFT5ForConditionalGeneration, T5Tokenizer
import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text += page.get_text()

    return text

def generate_summary(chunk):
    model_name = "t5-small"
    tokenizer = T5Tokenizer.from_pretrained(model_name, legacy=False)
    
    # Choose PyTorch or TensorFlow based on your preference
    # For PyTorch:
    # model = T5ForConditionalGeneration.from_pretrained(model_name)
    
    # For TensorFlow:
    model = TFT5ForConditionalGeneration.from_pretrained(model_name)

    input_ids = tokenizer.encode("summarize: " + chunk, return_tensors="pt", max_length=1024, truncation=True)
    summary_ids = model.generate(input_ids, max_length=300, num_beams=8, length_penalty=1.0, early_stopping=False)

    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

def upload_pdf():
    file_path = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
    
    if file_path:
        pdf_text = extract_text_from_pdf(file_path)

        # Split the text into chunks (you might need to fine-tune this based on your document structure)
        chunks = [chunk.strip() for chunk in pdf_text.split("\n") if chunk.strip()]
        
        # Generate summaries for each chunk
        summaries = [generate_summary(chunk) for chunk in chunks]

        # Combine summaries into a single comprehensive summary
        comprehensive_summary = "\n".join(summaries)

        result_text.config(state=tk.NORMAL)
        result_text.delete("1.0", tk.END)
        result_text.insert(tk.END, comprehensive_summary)
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
