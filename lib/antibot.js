// lib/antibot.js
module.exports = async function antibotBefore(m, { alya }) {
    try {
        let chat = global.db.data.chats[m.chat];
        if (!chat) return;

        // Jika AntiBot tidak aktif
        if (!chat.antiBot) return;

        // Deteksi bot lain (pesan Baileys dan bukan dari bot sendiri)
        if (m.isBaileys && m.sender !== alya.user.id) {

            await alya.sendMessage(m.chat, {
                text: "🚫 Bot lain terdeteksi dan dihapus!"
            }, { quoted: m });

            // Kick bot lain
            await alya.groupParticipantsUpdate(m.chat, [m.sender], "remove");
            return;
        }
    } catch (e) {
        console.log("AntiBot Error:", e);
    }
};
