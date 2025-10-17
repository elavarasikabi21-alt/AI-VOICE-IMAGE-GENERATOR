require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({limit: '10mb'}));

// --- 1. Language & Mood Detection (OpenAI) ---
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  try {
    const prompt = `Analyze the following text for language (English, Tamil, etc.) and mood (Positive, Negative, Neutral). Respond as JSON: {"language": "...", "mood": "..."}. Text: """${text}"""`;
    const resp = await openaiChat(prompt);
    const json = extractJSON(resp);
    res.json(json);
  } catch (e) {
    res.json({ language: "", mood: "" });
  }
});

// --- 2. Simplified Text, Prompt, Alt Text (OpenAI) ---
app.post('/api/generate_text', async (req, res) => {
  const { text } = req.body;
  try {
    const prompt = `Given: "${text}". 1) Rewrite as simplified text, 2) Write a creative prompt for an AI image generator, 3) Write an accessible alt text. Respond as JSON: {"simplified": "...", "prompt": "...", "alt_text": "..."}`;
    const resp = await openaiChat(prompt);
    const json = extractJSON(resp);
    res.json(json);
  } catch (e) {
    res.json({ simplified: "", prompt: "", alt_text: "" });
  }
});

// --- 3. Image Generation (Replicate Stable Diffusion) ---
app.post('/api/generate_image', async (req, res) => {
  const { prompt } = req.body;
  try {
    const replicateResp = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "a9758cb6e1c7ba4aab1cfae7a6b2da9b0f4dbfcbca4be6f7c0e0e1b7b6a4e1a8", // Stable Diffusion 1.5
        input: { prompt }
      })
    });
    const { id } = await replicateResp.json();
    // Poll status until completed
    let status = "starting", image_url = "";
    while (status !== "succeeded" && status !== "failed") {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` }
      });
      const pollData = await poll.json();
      status = pollData.status;
      if (status === "succeeded") image_url = pollData.output[0];
    }
    res.json({ image_url });
  } catch (e) {
    res.json({ image_url: "https://via.placeholder.com/400x300?text=Error" });
  }
});

// --- 4. Image Captioning (HuggingFace BLIP) ---
app.post('/api/caption_image', async (req, res) => {
  const { image_url } = req.body;
  try {
    const hfResp = await fetch("https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.HF_API_TOKEN}` },
      body: JSON.stringify({ inputs: image_url })
    });
    const result = await hfResp.json();
    const caption = Array.isArray(result) ? result[0]?.generated_text : "";
    res.json({ caption });
  } catch (e) {
    res.json({ caption: "" });
  }
});

// --- OpenAI Chat Helper ---
async function openaiChat(prompt) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await resp.json();
  return data.choices[0].message.content;
}
function extractJSON(resp) {
  try {
    const match = resp.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  } catch { return {}; }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));