# 🔒 Airlock

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

1. **Metadata Extraction:** The CLI reads the file structure (e.g., CSV headers, JSON keys) but **not** the full content.
2. **Code Generation:** Google Gemini (Cloud) writes a Python script based on the structure + user instruction.
3. **The "Air Gap":** Airlock spins up a Docker container with `NetworkDisabled: true`.
4. **Execution:** The container mounts the file, runs the script, and modifies the file in place.
5. **Self-Healing:** If the script crashes, Airlock captures the error logs, feeds them back to the AI, and retries automatically.

    <img src="server/asset/HLD.jpg" alt="High Level Design" width="60%">

---

## 🚀 Key Features

* **🛡️ Network Kill Switch:** Docker containers run with `--network none`. Even if the AI hallucinates malicious code to upload your data, the kernel blocks the connection.
* **🧠 Self-Healing Agent:** Automatically detects Python errors (Syntax, Missing Libs) and recursively asks the AI to fix its own code.

    <img src="server/asset/mermaid-diagram-2025-12-22T17-36-12.png" alt="Self-Heal Loop Flowchart" width="60%">
* **📂 Multi-Format Support:** Pre-loaded with a "Fat Image" containing:
    * **Data:** `pandas`, `numpy`, `scipy`
    * **Docs:** `python-docx` (Word), `pypdf` (PDF manipulation)
    * **Spreadsheets:** `openpyxl`, `xlsxwriter`
* **⚡ Universal CLI:** Written in Node.js, compatible with Windows, Mac, and Linux.
* **🖥️ Web UI:** Modern React-based interface for easy file processing.

---

## 🛠️ Installation

### Prerequisites

* **Node.js** (v18+)
* **Docker Desktop** (Running)
* **Google Gemini API Key** (Free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/airlock.git
cd airlock
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env  # If you have an example file
```

Add your configuration:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
# Optional: For audit logging
DATABASE_URL=postgresql://user:password@localhost:5432/airlock
```

---

## 🚀 Development

### Running Both Frontend and Backend

From the `server` directory:

```bash
npm run dev
```

This will start:
- **Backend server** on `http://localhost:3000`
- **Frontend dev server** on `http://localhost:5173`

The frontend will automatically proxy API requests to the backend during development.

### Running Separately

**Backend only:**
```bash
cd server
npm run server
# Server runs on http://localhost:3000
```

**Frontend only:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### CLI Usage

You can also use Airlock via the command line:

```bash
# From the server directory
node src/index.js edit <file> --instruction "Your instruction here"
```

---

## 📦 Production Build

### Build Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.

### Run Production Server

The Express server will automatically serve the built frontend files when `NODE_ENV=production`:

```bash
cd server
NODE_ENV=production npm run server
```

The server will:
- Serve the React app from `frontend/dist/`
- Handle API requests at `/api/*`
- Serve the frontend for all other routes

---

## 📁 Project Structure

```
GhostDock/
├── server/                 # Backend Express server
│   ├── src/
│   │   ├── index.js       # CLI entry point
│   │   ├── server.js      # Express server
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (AI, Docker, File editing)
│   │   ├── models/        # Database models
│   │   └── utils/         # Utilities
│   └── package.json
├── frontend/              # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── components/    # React components
│   │   └── api/           # API client
│   └── package.json
└── README.md             # This file
```

---

## ✅ Completed Features

### 🖥️ Web UI (React)
* **Status:** ✅ Completed
* **Description:** Modern React-based web interface that makes Airlock accessible to non-technical users. Features include:
    * Drag-and-drop file upload
    * Instruction input interface
    * Real-time processing status
    * Download processed files
* **Access:** Available at `http://localhost:5173` in development mode

    <img src="server/asset/UI_sample.png" alt="UI Sample" width="60%">


### 🕵️‍♂️ Audit Trails (PostgreSQL/SQLite)
* **Status:** ✅ Completed
* **Description:** Enterprise accountability through comprehensive audit logging. Logs every operation including:
    * Timestamp
    * File Name
    * User Instruction
    * Python Script Executed
    * File Hash (Before/After)
* **Implementation:** Supports both PostgreSQL (via `DATABASE_URL`) and can be extended for SQLite

---

## 🔮 Future Roadmap

### 1. 🛡️ PII Redaction Layer
* **Goal:** Prevent accidental leakage of sensitive data in prompts.
* **Plan:** Implement a Regex pre-processor that detects patterns (Emails, SSNs, Credit Cards) in the file preview and replaces them with `[REDACTED]` *before* sending the context to the AI.

### 2. 📦 Plugin System
* **Goal:** Extensibility.
* **Plan:** Allow users to add custom Python libraries to the Docker container via a `requirements.txt` file in their project folder.


---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

