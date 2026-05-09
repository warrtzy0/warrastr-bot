const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

const CONFIG = {
    GEMINI: {
        URL: "https://us-central1-gemmy-ai-bdc03.cloudfunctions.net/gemini",
        MODEL: "gemini-2.5-flash-lite",
        HEADERS: {
            'User-Agent': 'okhttp/5.3.2',
            'Accept-Encoding': 'gzip',
            'content-type': 'application/json; charset=UTF-8'
        }
    },
    IMAGEN: {
        URL: "https://firebasevertexai.googleapis.com/v1beta/projects/gemmy-ai-bdc03/models/imagen-4.0-fast-generate-001:predict",
        HEADERS: {
            'User-Agent': 'ktor-client',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'Content-Type': 'application/json',
            'x-goog-api-key': 'AIzaSyAxof8_SbpDcww38NEQRhNh0Pzvbphh-IQ',
            'x-goog-api-client': 'gl-kotlin/2.2.21-ai fire/17.7.0',
            'x-firebase-appid': '1:652803432695:android:c4341db6033e62814f33f2',
            'x-firebase-appversion': '91',
            'x-firebase-appcheck': 'eyJlcnJvciI6IlVOS05PV05fRVJST1IifQ==',
            'accept-charset': 'UTF-8'
        }
    }
};

const SYSTEM_INSTRUCTION = {
    role: "user",
    parts: [{
        text: "Nama kamu adalah Alya Mikhailovna Kujou dan dibuat oleh ${global.ownername} dan tugas kamu adalah melayani permintaan ${pushname}.\n\n"
    }]
};

async function getNewToken() {
    try {
        const response = await axios.post(
            'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyAxof8_SbpDcww38NEQRhNh0Pzvbphh-IQ',
            { clientType: "CLIENT_TYPE_ANDROID" },
            {
                headers: {
                    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 12; SM-S9280 Build/AP3A.240905.015.A2)',
                    'Content-Type': 'application/json',
                    'X-Android-Package': 'com.jetkite.gemmy',
                    'X-Android-Cert': '037CD2976D308B4EFD63EC63C48DC6E7AB7E5AF2',
                    'X-Firebase-GMPID': '1:652803432695:android:c4341db6033e62814f33f2'
                }
            }
        );
        return response.data.idToken;
    } catch (error) {
        console.error(`[Token Generation Error]:`, error.response ? JSON.stringify(error.response.data) : error.message);
        return null;
    }
}

const uploadToCloud = async (buffer) => {
    try {
        const filename = `gemmy-${crypto.randomUUID()}.png`;
        const { data } = await axios.post('https://api.cloudsky.biz.id/get-upload-url', {
            fileKey: filename,
            contentType: 'image/png',
            fileSize: buffer.length
        });

        await axios.put(data.uploadUrl, buffer, {
            headers: { 
                'Content-Type': 'image/png', 
                'Content-Length': buffer.length,
                'x-amz-server-side-encryption': 'AES256' 
            }
        });

        return `https://api.cloudsky.biz.id/file?key=${encodeURIComponent(filename)}`;
    } catch (error) {
        console.error(`[Cloud Upload Error]: ${error.message}`);
        return null;
    }
};

const toBase64 = async (input) => {
    try {
        let buffer;
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (input.startsWith('http')) {
            const res = await axios.get(input, { responseType: 'arraybuffer' });
            buffer = Buffer.from(res.data);
        } else if (fs.existsSync(input)) {
            buffer = fs.readFileSync(input);
        } else {
            return null;
        }
        return buffer.toString('base64');
    } catch (e) { return null; }
};

const getMimeType = (pathOrUrl) => {
    const ext = pathOrUrl.split('.').pop().toLowerCase();
    const mimes = { 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp' };
    return mimes[ext] || 'application/octet-stream';
};

const gemmy = {
    chat: async (prompt, history = [], media = null) => {
        const token = await getNewToken();
        if (!token) {
            return { success: false, msg: 'Gagal mendapatkan token autentikasi' };
        }

        const executeRequest = async (currentHistory) => {
            const payload = {
                model: CONFIG.GEMINI.MODEL,
                request: {
                    contents: currentHistory,
                    generationConfig: { maxOutputTokens: 4000, temperature: 2.0 },
                    systemInstruction: SYSTEM_INSTRUCTION
                },
                stream: false
            };
            const headers = { ...CONFIG.GEMINI.HEADERS, authorization: `Bearer ${token}` };
            return await axios.post(CONFIG.GEMINI.URL, payload, { headers });
        };

        try {
            let parts = [];

            if (media) {
                const base64Data = await toBase64(media);
                if (base64Data) {
                    const isImage = typeof media === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(media);
                    if (isImage) {
                        parts.push({
                            inlineData: { mimeType: getMimeType(media), data: base64Data }
                        });
                        parts.push({ text: prompt });
                    } else {
                        const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
                        parts.push({ text: `${prompt}\n\n--- DOCUMENT CONTENT ---\n\n${decodedText}` });
                    }
                } else {
                    parts.push({ text: prompt });
                }
            } else {
                parts.push({ text: prompt });
            }

            const newHistory = [...history, { role: "user", parts: parts }];
            let response = await executeRequest(newHistory);
            const result = response.data;

            if (result.candidates && result.candidates.length > 0) {
                const reply = result.candidates[0].content;
                newHistory.push(reply);
                return {
                    success: true,
                    reply: reply.parts[0].text,
                    history: newHistory,
                    usage: result.usageMetadata
                };
            }
            return { success: false, msg: 'No response candidates found', raw: result };

        } catch (error) {
            console.error(`[Gemini Chat Error]: ${error.message}`);
            return { success: false, msg: error.message };
        }
    },

    generateImage: async (prompt, options = {}) => {
        try {
            const payload = {
                instances: [{ prompt: prompt }],
                parameters: {
                    sampleCount: 1,
                    includeRaiReason: true,
                    includeSafetyAttributes: true,
                    aspectRatio: options.aspectRatio || "1:1",
                    safetySetting: "block_low_and_above",
                    personGeneration: "allow_adult",
                    imageOutputOptions: { mimeType: "image/jpeg", compressionQuality: 100 }
                }
            };

            const response = await axios.post(CONFIG.IMAGEN.URL, payload, { headers: CONFIG.IMAGEN.HEADERS });
            const predictions = response.data.predictions;

            if (predictions && predictions.length > 0 && predictions[0].bytesBase64Encoded) {
                const imgBuffer = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
                const url = await uploadToCloud(imgBuffer);
                
                if (url) {
                    return { success: true, url: url, safetyAttributes: predictions[0].safetyAttributes };
                } else {
                    return { success: false, msg: 'Failed to upload image to cloud' };
                }
            }
            return { success: false, msg: 'No image generated' };

        } catch (error) {
            console.error(`[Imagen Error]: ${error.message}`);
            return { success: false, msg: error.message };
        }
    }
};

module.exports = { gemmy };