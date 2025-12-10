require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkConnection() {
  console.log("📡 Pinging Google AI Servers...");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // We use the specific versioned model name to avoid 404s
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent("Reply with only the word: Connected.");
    const response = await result.response;
    
    console.log("✅ SUCCESS!");
    console.log("Server Responded:", response.text().trim());

  } catch (error) {
    console.log("❌ CONNECTION FAILED");
    if (error.message.includes('404')) {
        console.log("Reason: The model name is wrong for your API key region.");
    } else if (error.message.includes('403') || error.message.includes('key')) {
        console.log("Reason: Your API_KEY in .env is invalid.");
    } else {
        console.log("Error:", error.message);
    }
  }
}

checkConnection();