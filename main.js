// ---- CONFIG ----
const API_BASE = 'https://your-backend-domain.com/api'; // Change to your backend

// ---- STATE ----
let recognizing = false, recognition;
let lastInputText = "", lastPrompt = "";
// Lightweight frontend to call your backend (adjust API_BASE if needed)
const API_BASE = 'http://localhost:5000'; // change if your server is remote

const textInput = document.getElementById('text-input');
const micBtn = document.getElementById('mic-btn');
const generateBtn = document.getElementById('generate-btn');

const langInfo = document.getElementById('lang-info');
const moodInfo = document.getElementById('mood-info');
const simpleTextSpan = document.getElementById('simple-text');
const imgPromptSpan = document.getElementById('img-prompt');
const altTextSpan = document.getElementById('alt-text');
const imageGrid = document.getElementById('image-grid');
const uploadImg = document.getElementById('upload-img');

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

generateBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) return alert('Enter text first');
  simpleTextSpan.textContent = 'Loading...';
  try {
    const data = await postJSON('/api/generate_text', { text });
    simpleTextSpan.textContent = data.simplified || '';
    imgPromptSpan.textContent = data.prompt || '';
    altTextSpan.textContent = data.alt_text || '';
  } catch (e) {
    console.error(e);
    simpleTextSpan.textContent = 'Error';
  }
});

textInput.addEventListener('input', async () => {
  const text = textInput.value.trim();
  if (!text) { langInfo.textContent = ''; moodInfo.textContent = ''; return; }
  try {
    const data = await postJSON('/api/analyze', { text });
    langInfo.textContent = data.language ? `Language: ${data.language}` : '';
    moodInfo.textContent = data.mood ? `Mood: ${data.mood}` : '';
  } catch (e) {
    console.error(e);
  }
});

uploadImg.addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => addImageCard(e.target.result, 'User uploaded image', 'User image');
  reader.readAsDataURL(file);
});

function addImageCard(src, alt, caption) {
  const card = document.createElement('div');
  card.className = 'image-card';
  card.innerHTML = `
    <img src="${src}" alt="${alt}" class="card-image" style="max-width:100%">
    <div class="caption"><strong>Caption:</strong> <span class="img-caption">${caption}</span></div>
    <div><strong>Alt Text:</strong> <span class="img-alt">${alt}</span></div>
    <button class="download-btn">Download</button>
  `;
  card.querySelector('.download-btn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = 'image.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  imageGrid.appendChild(card);
}
// ---- 1. VOICE INPUT (Speech to Text) ----
const micBtn = document.getElementById('mic-btn');
const textInput = document.getElementById('text-input');
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;

  micBtn.addEventListener('click', () => {
    if (!recognizing) {
      recognition.start();
      micBtn.textContent = "🛑 Stop";
      recognizing = true;
    } else {
      recognition.stop();
      micBtn.textContent = "🎤 Speak";
      recognizing = false;
    }
  });

  recognition.onresult = function(event) {
    textInput.value = event.results[0][0].transcript;
    recognizing = false;
    micBtn.textContent = "🎤 Speak";
    detectLanguageAndMood();
  };
  recognition.onend = function() {
    recognizing = false;
    micBtn.textContent = "🎤 Speak";
  };
} else {
  micBtn.disabled = true;
  micBtn.title = "Speech Recognition not supported in this browser.";
}

// ---- 2. LANGUAGE & MOOD DETECTION (REAL NLP API) ----
const langInfo = document.getElementById('lang-info');
const moodInfo = document.getElementById('mood-info');
textInput.addEventListener('input', detectLanguageAndMood);

async function detectLanguageAndMood() {
  const text = textInput.value.trim();
  if (!text) {
    langInfo.textContent = '';
    moodInfo.textContent = '';
    return;
  }
  // Replace with your real NLP API!
  try {
    const resp = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text })
    });
    const data = await resp.json();
    langInfo.textContent = data.language ? `Language: ${data.language}` : '';
    moodInfo.textContent = data.mood ? `Mood: ${data.mood}` : '';
  } catch (e) {
    langInfo.textContent = '';
    moodInfo.textContent = '';
  }
}

// ---- 3. GENERATE BUTTON: Simplification, Prompt, Alt Text (REAL LLM) ----
const generateBtn = document.getElementById('generate-btn');
const simpleTextSpan = document.getElementById('simple-text');
const imgPromptSpan = document.getElementById('img-prompt');
const altTextSpan = document.getElementById('alt-text');

generateBtn.addEventListener('click', async () => {
  const input = textInput.value.trim();
  if (!input) return;
  lastInputText = input;

  // Real LLM API for simplification, prompt, alt text
  simpleTextSpan.textContent = "Loading...";
  imgPromptSpan.textContent = "";
  altTextSpan.textContent = "";

  try {
    const resp = await fetch(`${API_BASE}/generate_text`, {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text: input })
    });
    const data = await resp.json();
    simpleTextSpan.textContent = data.simplified || "";
    imgPromptSpan.textContent = data.prompt || "";
    altTextSpan.textContent = data.alt_text || "";
    lastPrompt = data.prompt || "";
  } catch (e) {
    simpleTextSpan.textContent = "Error.";
    imgPromptSpan.textContent = "";
    altTextSpan.textContent = "";
  }
});

// ---- 4. TTS BUTTONS ----
document.getElementById('tts-simple').addEventListener('click', () =>
  speakText(simpleTextSpan.textContent)
);
document.getElementById('tts-prompt').addEventListener('click', () =>
  speakText(imgPromptSpan.textContent)
);
document.getElementById('tts-alt').addEventListener('click', () =>
  speakText(altTextSpan.textContent)
);

function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  window.speechSynthesis.speak(utter);
}

// ---- 5. IMAGE GENERATION & UPLOAD ----
const imageGrid = document.getElementById('image-grid');
const uploadImg = document.getElementById('upload-img');

imgPromptSpan.addEventListener('DOMSubtreeModified', async () => {
  if (!imgPromptSpan.textContent) return;
  // Call real image generation API
  const prompt = imgPromptSpan.textContent;
  addImageCard("loading", altTextSpan.textContent, 'Generating...');
  try {
    const resp = await fetch(`${API_BASE}/generate_image`, {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ prompt })
    });
    const data = await resp.json();
    // Assume data.image_url is the result
    imageGrid.lastChild.querySelector('img').src = data.image_url;
    imageGrid.lastChild.querySelector('.img-caption').textContent = "AI-generated image";
  } catch (e) {
    imageGrid.lastChild.querySelector('.img-caption').textContent = "Failed to generate image.";
  }
});

uploadImg.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    addImageCard(e.target.result, 'User uploaded image', 'User image');
  };
  reader.readAsDataURL(file);
});

// ---- 6. IMAGE CARD: VOICE EDIT, AI CAPTION, DOWNLOAD, TTS ----
function addImageCard(imageUrl, alt, caption) {
  const card = document.createElement('div');
  card.className = 'image-card';
  card.innerHTML = `
    <img src="${imageUrl === "loading" ? "https://i.stack.imgur.com/kOnzy.gif" : imageUrl}" alt="${alt}" class="card-image">
    <div class="caption">
      <strong>Caption:</strong>
      <span class="img-caption">${caption}</span>
      <button class="tts-btn" title="Listen Caption">🔊</button>
      <button class="edit-caption-btn" title="AI Caption">✨ Auto Caption</button>
    </div>
    <div>
      <strong>Alt Text:</strong>
      <span class="img-alt">${alt}</span>
      <button class="tts-btn" title="Listen Alt">🔊</button>
    </div>
    <button class="voice-edit-btn"><span class="icon">🎤</span> Voice Edit</button>
    <button class="download-btn">Download</button>
  `;
  imageGrid.appendChild(card);

  // TTS for caption
  card.querySelectorAll('.tts-btn')[0].addEventListener('click', () => {
    speakText(card.querySelector('.img-caption').textContent);
  });
  // TTS for alt text
  card.querySelectorAll('.tts-btn')[1].addEventListener('click', () => {
    speakText(card.querySelector('.img-alt').textContent);
  });
  // Download
  card.querySelector('.download-btn').addEventListener('click', () => {
    downloadImage(card.querySelector('img').src);
  });
  // Voice Edit
  card.querySelector('.voice-edit-btn').addEventListener('click', () => {
    openVoiceEditModal(card, card.querySelector('img').src, card.querySelector('.img-caption').textContent);
  });
  // AI Caption
  card.querySelector('.edit-caption-btn').addEventListener('click', async () => {
    card.querySelector('.img-caption').textContent = "Generating...";
    try {
      // Real vision API for image captioning
      const resp = await fetch(`${API_BASE}/caption_image`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ image_url: card.querySelector('img').src })
      });
      const data = await resp.json();
      card.querySelector('.img-caption').textContent = data.caption || "No caption.";
    } catch (e) {
      card.querySelector('.img-caption').textContent = "Failed to caption.";
    }
  });
}

// ---- 7. DOWNLOAD IMAGE ----
function downloadImage(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---- 8. VOICE EDIT MODAL FOR IMAGE ----
const voiceEditModal = document.getElementById('voiceEditModal');
const closeModal = document.getElementById('closeModal');
const startVoiceEditBtn = document.getElementById('startVoiceEditBtn');
const voiceEditStatus = document.getElementById('voiceEditStatus');
const voiceEditText = document.getElementById('voiceEditText');
let currentEditCard = null, currentEditImgUrl = null, currentEditCaption = "";

function openVoiceEditModal(card, imageUrl, caption) {
  voiceEditModal.style.display = 'block';
  voiceEditStatus.textContent = '';
  voiceEditText.textContent = '';
  currentEditCard = card;
  currentEditImgUrl = imageUrl;
  currentEditCaption = caption;
}

closeModal.onclick = function() {
  voiceEditModal.style.display = 'none';
};
window.onclick = function(event) {
  if (event.target == voiceEditModal) voiceEditModal.style.display = 'none';
};

startVoiceEditBtn.addEventListener('click', () => {
  if (!recognition) return;
  voiceEditStatus.textContent = "Listening...";
  recognition.start();
  recognition.onresult = async function(event) {
    const editCmd = event.results[0][0].transcript;
    voiceEditText.textContent = editCmd;
    voiceEditStatus.textContent = "Applying edit: " + editCmd;

    // Call your image generation API with the new prompt (original caption + edit)
    try {
      const resp = await fetch(`${API_BASE}/generate_image`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ prompt: `${currentEditCaption}. ${editCmd}` })
      });
      const data = await resp.json();
      // Update image and caption
      currentEditCard.querySelector('img').src = data.image_url;
      currentEditCard.querySelector('.img-caption').textContent = editCmd;
    } catch (e) {
      voiceEditStatus.textContent = "Failed to edit image.";
    }
    setTimeout(() => { voiceEditModal.style.display = 'none'; }, 1500);
  };
  recognition.onend = function() {
    voiceEditStatus.textContent = '';
  };
});

// ---- 9. QR CODE SHARING (requires QRCode.js) ----
const shareLink = document.getElementById('share-link');
const qrCanvas = document.getElementById('qr-code');
const copyLinkBtn = document.getElementById('copy-link');

function generateShareLink() {
  shareLink.value = window.location.href;
  if (window.QRCode) {
    qrCanvas.innerHTML = '';
    new QRCode(qrCanvas, shareLink.value);
  }
}
if (shareLink && qrCanvas) generateShareLink();

copyLinkBtn.addEventListener('click', () => {
  shareLink.select();
  document.execCommand('copy');
  copyLinkBtn.textContent = "Copied!";
  setTimeout(() => { copyLinkBtn.textContent = "Copy Link"; }, 1500);
});

// ---- 10. EXPORT JSON ----
const exportBtn = document.getElementById('export-json');
exportBtn.addEventListener('click', () => {
  const images = [];
  document.querySelectorAll('.image-card').forEach(card => {
    images.push({
      url: card.querySelector('img').src,
      alt: card.querySelector('.img-alt').textContent,
      caption: card.querySelector('.img-caption').textContent
    });
  });
  const data = {
    originalText: textInput.value,
    language: langInfo.textContent,
    mood: moodInfo.textContent,
    simplifiedText: simpleTextSpan.textContent,
    imagePrompt: imgPromptSpan.textContent,
    altText: altTextSpan.textContent,
    images
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ai-voice-image-session.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});