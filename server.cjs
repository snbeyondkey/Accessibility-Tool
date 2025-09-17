require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/gemini-alt-text', async (req, res) => {
  const { imageBase64 } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) return res.status(400).json({ error: 'Missing Gemini API key' });
  if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });

  // Robust base64 extraction
  let base64Data = imageBase64;
  let mimeType = "image/png";
  if (base64Data.startsWith('data:')) {
    const matches = base64Data.match(/^data:(image\/[a-zA-Z]+);base64,/);
    if (matches) mimeType = matches[1];
    const parts = base64Data.split(',');
    if (parts.length === 2) {
      base64Data = parts[1];
    }
  }

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: "Describe this image for alt text accessibility." },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                }
              }
            ]
          }
        ]
      }
    );
    const altText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "No alt text generated.";
    res.json({ output: altText });
  } catch (err) {
    res.status(500).json({ error: err?.response?.data || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});