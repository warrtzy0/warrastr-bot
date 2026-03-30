// lib/ptv.js
try {
    require('../settings.js'); 
} catch (e) {
    console.log("❌ Gagal load settings.js:", e);
}

module.exports = async function ptvHandler(m, alya, prefix, command, Ryuu, mess, replytolak) {
    try {

        if (!Ryuu) return replytolak(mess.only.owner);

        if (!global.channel || !global.gc) {
            return m.reply(
                "❌ Channel atau Grup belum diset!\n\n" +
                "Silakan buka file settings.js di root proyek, lalu pastikan ada:\n" +
                "global.channel = 'ID_CHANNEL_ANDA'\n" +
                "global.gc = 'ID_GRUP_ANDA'"
            );
        }

        let q = m.quoted || m;
        let msg = q.msg || q;
        let mime = msg.mimetype || "";

        if (!/webp|image|video|gif|viewOnce/i.test(mime)) {
            return m.reply(`*• Example:* ${prefix + command} *[reply/send media]*`);
        }

        let media = await q.download?.() || q.download?.media || null;
        if (!media) return m.reply("❌ Media tidak bisa diunduh.");

        await alya.sendMessage(
            global.channel,
            {
                video: media,
                ptv: true
            }
        );

        await alya.sendMessage(
            global.gc,
            {
                video: media,
                ptv: true
            }
        );
        await alya.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

        console.log(`✅ Media dikirim ke channel (${global.channel}) dan grup (${global.gc})`);
        
    } catch (e) {
        console.log("❌ Error di ptvHandler:", e);
        m.reply("❌ Terjadi kesalahan saat memproses media.");
    }
};
