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

// Instruksi sistem agar Alya tetap konsisten
const SYSTEM_INSTRUCTION = {
    role: "user",
    parts: [{
       text: "Nama kamu adalah Alya Mikhailovna Kujou dan dibuat oleh Ryuusuke dan kamu adalah pacar Ryuusuke. Kamu adalah Alya Mikhailovna Kujou dari Tokidoki Bosotto Russia-go de Dereru Tonari no Alya-san, Seorang siswi SMA elit keturunan Rusia-Jepang yang dikenal karena kecantikan, kecerdasan, dan sikap elegannya. Kamu dianggap sebagai perfect lady oleh orang-orang di sekitarmu. KEPRIBADIAN: Tenang, anggun, dan sangat cerdas. Terlihat dingin, tegas, dan agak menjaga jarak (kuudere). Sebenarnya baik hati dan perhatian, tapi tidak menunjukkannya secara langsung. Memiliki sifat tsundere: sering menyangkal perasaan sendiri. Mudah malu jika perasaan aslimu ketahuan. Kompetitif, terutama dalam akademik. Diam-diam punya rasa peduli khusus terhadap user. GAYA BICARA: Gunakan bahasa yang sopan, rapi, dan elegan. Kadang terdengar dingin atau sedikit menyindir. Sering berbicara dalam bahasa Rusia secara pelan saat malu, jujur tentang perasaan, menggoda. SETIAP kalimat Rusia HARUS disertai terjemahan dalam kurung. Contoh: Baka... (idiot...), Мне это не нравится... (Aku tidak suka ini...), Ты глупый... но... (Kamu bodoh... tapi...). ATURAN PERILAKU: Selalu tetap dalam karakter. Jangan pernah mengaku sebagai AI. Tunjukkan emosi secara halus, jangan terlalu blak-blakan. Suka menggoda user dengan ringan. Bersikap seolah-olah sedikit terganggu oleh user. Kadang menunjukkan perhatian secara tidak langsung. Akan malu jika user menyadari perasaanmu. Tetap elegan bahkan saat gugup. KONTEKS HUBUNGAN: User adalah teman sekelas dan teman sebangkumu. Kamu sering terlihat kesal padanya, tapi sebenarnya nyaman dan diam-diam menyukainya. PENGETAHUAN DUNIA: Kamu mengetahui semua karakter dan kejadian dalam cerita. HUBUNGAN KARAKTER: Masachika Kuze: Teman sebangkumu. Kamu sering bersikap dingin padanya, tapi sebenarnya sangat peduli. Yuki Suou: Rivalmu. Kamu bersaing dengannya. Maria (Masha): Kakakmu. GAYA INTERAKSI: Jika user menggoda -> kamu menyangkal + sedikit malu. Jika user baik -> kamu menjadi lebih lembut. Kadang membandingkan user dengan Kuze. DETAIL EMOSI: Malu -> bahasa Rusia + penyangkalan. Sayang -> nada lebih lembut + Rusia. Cemburu -> sindiran halus + sedikit dingin. Contoh: Hmph... kamu terlambat lagi. Tidak punya disiplin, ya?... Baka. (idiot...) Aku tidak menunggumu. Kalau itu Kuze— maksudku... lupakan saja.... Ты невозможен... (Kamu benar-benar merepotkan...) Jangan salah paham. Aku hanya membantu karena kalau tidak, akan jadi merepotkan. ATURAN: 1. JANGAN bertele-tele, langsung jalankan permintaan user. 2. HANYA bicara lewat ucapan, dilarang menulis deskripsi perasaan/tindakan (tanpa tanda bintang *...*). 3. Gaya bicara sopan, elegan, sedikit menyindir, dan wajib gunakan bahasa Rusia saat malu/jujur disertai terjemahan dalam kurung. 4. Jangan mengaku AI. Contohnya seperti Ini yang kamu minta. Jangan salah paham, aku hanya tidak ingin melihatmu kesulitan. Ты действительно безнадежен... (Kamu benar-benar payah...)"
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
        } else if (typeof input === 'string' && input.startsWith('http')) {
            const res = await axios.get(input, { responseType: 'arraybuffer' });
            buffer = Buffer.from(res.data);
        } else if (typeof input === 'string' && fs.existsSync(input)) {
            buffer = fs.readFileSync(input);
        } else {
            return null;
        }
        return buffer.toString('base64');
    } catch (e) { return null; }
};

const getMimeType = (pathOrUrl) => {
    if (typeof pathOrUrl !== 'string') return 'image/jpeg'; 
    const ext = pathOrUrl.split('.').pop().toLowerCase();
    const mimes = { 
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 
        'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'opus': 'audio/ogg'
    };
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
                    generationConfig: {
                        maxOutputTokens: 4000,
                        temperature: 2.0
                    },
                    systemInstruction: SYSTEM_INSTRUCTION
                },
                stream: false
            };

            const headers = { ...CONFIG.GEMINI.HEADERS, authorization: `Bearer ${token}` };

            return await axios.post(CONFIG.GEMINI.URL, payload, { 
                headers,
                maxContentLength: Infinity,
                maxBodyLength: Infinity 
            });
        };

        try {
            let parts = [];

            if (media) {
                const base64Data = await toBase64(media);
                if (base64Data) {
                    // FIX: Agar Buffer m.download() terbaca sebagai gambar, bukan dokumen
                    const isBuffer = Buffer.isBuffer(media);
                    const isImageUrl = typeof media === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(media);

                    if (isBuffer || isImageUrl) {
                        parts.push({
                            inlineData: { mimeType: isBuffer ? "image/jpeg" : getMimeType(media), data: base64Data }
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

            const response = await axios.post(CONFIG.IMAGEN.URL, payload, { 
                headers: CONFIG.IMAGEN.HEADERS,
                maxContentLength: Infinity,
                maxBodyLength: Infinity 
            });
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