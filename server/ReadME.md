# 🔒 Airlock (formerly GhostDock)



> **"AI modification in a vacuum."**
> Securely edit sensitive local files using Cloud AI intelligence without your data ever leaving the machine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.0-green)
![Docker](https://img.shields.io/badge/docker-required-blue)
![AI](https://img.shields.io/badge/model-Gemini%202.5%20Flash-orange)

---

## 🛑 The Problem
Enterprises and privacy-conscious users want to use LLMs (Large Language Models) to manipulate documents (PDFs, Excel, Sensitive JSON), but they **cannot risk sending PII or proprietary data to the cloud**.

## ✅ The Solution: Airlock
Airlock implements a **"Blind Surgeon" architecture**. It sends *only* file metadata (schema/headers) to the LLM to generate code. That code is then executed locally in a strictly **offline** Docker container.

**Your data never leaves your hard drive.**

---

## 🏗️ Architecture



1.  **Metadata Extraction:** The CLI reads the file structure (e.g., CSV headers, JSON keys) but **not** the full content.
2.  **Code Generation:** Google Gemini (Cloud) writes a Python script based on the structure + user instruction.
3.  **The "Air Gap":** Airlock spins up a Docker container with `NetworkDisabled: true`.
4.  **Execution:** The container mounts the file, runs the script, and modifies the file in place.
5.  **Self-Healing:** If the script crashes, Airlock captures the error logs, feeds them back to the AI, and retries automatically.

---

## 🚀 Key Features

* **🛡️ Network Kill Switch:** Docker containers run with `--network none`. Even if the AI hallucinates malicious code to upload your data, the kernel blocks the connection.
* **🧠 Self-Healing Agent:** Automatically detects Python errors (Syntax, Missing Libs) and recursively asks the AI to fix its own code.
* **📂 Multi-Format Support:** Pre-loaded with a "Fat Image" containing:
    * **Data:** `pandas`, `numpy`, `scipy`
    * **Docs:** `python-docx` (Word), `pypdf` (PDF manipulation)
    * **Spreadsheets:** `openpyxl`, `xlsxwriter`
* **⚡ Universal CLI:** Written in Node.js, compatible with Windows, Mac, and Linux.

---

## 🛠️ Installation

### Prerequisites
* **Node.js** (v18+)
* **Docker Desktop** (Running)
* **Google Gemini API Key** (Free tier works)

### 1. Clone & Install
```bash
git clone [https://github.com/yourusername/airlock.git](https://github.com/yourusername/airlock.git)
cd airlock
npm install
```
## 🔮 Future Roadmap

### 1. 🖥️ Desktop GUI (Electron/React)
* **Goal:** Make Airlock accessible to non-technical users (HR, Finance, Legal) who aren't comfortable with the Command Line.
* **Plan:** Build a simple drag-and-drop interface where users can:
    1.  Drop a file.
    2.  Type an instruction (e.g., "Summarize this").
    3.  See a real-time progress bar of the Docker container.
    4.  View a "Diff" of the changes before saving.

### 2. 🔒 Local LLM Support (Ollama)
* **Goal:** Achieve **100% Air-Gapped Privacy**.
* **Plan:** Allow users to swap Google Gemini (Cloud) for a local model like `Llama 3` or `Mistral` running via Ollama.
* **Benefit:** Even the *prompt* never leaves the laptop.

### 3. 🛡️ PII Redaction Layer
* **Goal:** Prevent accidental leakage of sensitive data in prompts.
* **Plan:** Implement a Regex pre-processor that detects patterns (Emails, SSNs, Credit Cards) in the file preview and replaces them with `[REDACTED]` *before* sending the context to the AI.

### 4. 🕵️‍♂️ Audit Trails (SQLite)
* **Goal:** Enterprise accountability.
* **Plan:** Create a local `airlock.db` that logs every operation:
    * Timestamp
    * File Name
    * User Instruction
    * Python Script Executed
    * File Hash (Before/After)

### 5. 📦 Plugin System
* **Goal:** Extensibility.
* **Plan:** Allow users to add custom Python libraries to the Docker container via a `requirements.txt` file in their project folder.
