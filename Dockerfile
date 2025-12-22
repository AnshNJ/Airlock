FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    build-essential \
    # The "Eyes" (OCR Engine)
    tesseract-ocr \
    tesseract-ocr-eng \
    # The "Lens" (PDF to Image converter)
    poppler-utils \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python Libraries
RUN pip install --no-cache-dir \
    pandas \
    openpyxl \
    python-docx \
    pypdf \
    sumy \
    nltk \
    tinysegmenter \
    # OCR Python Wrappers
    pytesseract \
    pdf2image \
    pillow

# Download NLTK data (The "brains" for the micro-model)
RUN python -m nltk.downloader -d /usr/local/share/nltk_data punkt punkt_tab stopwords

WORKDIR /data
RUN useradd -m ghostuser
USER ghostuser