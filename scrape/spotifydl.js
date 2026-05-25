const axios = require("axios")

async function spotifydl(trackUrl) {
    if (!/spotify\.com\/track\//i.test(trackUrl)) {
        throw new Error("Link Spotify tidak valid")
    }

    // hilangkan parameter query
    trackUrl = trackUrl.split("?")[0]

    // 1️⃣ Request API sssspotify
    const postResponse = await axios.post(
        "https://sssspotify.com/api/download/get-url",
        { url: trackUrl },
        {
            headers: {
                "Content-Type": "application/json",
                "Origin": "https://sssspotify.com",
                "Referer": "https://sssspotify.com/",
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json, text/plain, */*",
            },
        }
    )

    const data = postResponse.data

    if (!data || data.code !== 200) {
        throw new Error("Gagal mendapatkan URL download")
    }

    const downloadUrl = "https://sssspotify.com" + data.originalVideoUrl

    // 2️⃣ Ambil file audio
    const audioRes = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        headers: {
            "Referer": "https://sssspotify.com/",
            "User-Agent": "Mozilla/5.0",
        },
    })

    return {
        title: data.title || "Spotify Audio",
        downloadUrl,
        audio: Buffer.from(audioRes.data)
    }
}

module.exports = { spotifydl }