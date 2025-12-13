# Dockerfile
FROM python:3.11-slim

# 1. Environment Variables to keep Python clean
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 2. Install System Dependencies (Required for some heavy Python libs)
# We install 'build-essential' for compiling C extensions if needed
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 3. Install The "Office Automation" Stack
RUN pip install --no-cache-dir \
    # Data Science & Excel
    pandas \
    numpy \
    openpyxl \
    xlsxwriter \
    # PDF Manipulation
    pypdf \
    reportlab \
    pdfminer.six \
    # Word Documents
    python-docx \
    # Basic Text Processing
    nltk

# 4. Set the secure working directory
WORKDIR /data

# 5. Create a non-root user (Security Best Practice)
# This prevents the container from having root access even inside itself
RUN useradd -m ghostuser
USER ghostuser