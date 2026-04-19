const fs = require('fs')
const path = require('path')
const dndFile = path.join(__dirname, '../data/dnd.json')

const loadDND = () => {
    try {
        if (fs.existsSync(dndFile)) return JSON.parse(fs.readFileSync(dndFile))
    } catch {}
    return { active: false, message: 'Lagi DND, nanti balas ya! 🔕', replied: {}, spam: {} }
}

const saveDND = (data) => {
    try { fs.writeFileSync(dndFile, JSON.stringify(data, null, 2)) } catch {}
}

async function handleDND(alya, m, settings) {
    const sender = m.sender
    const isOwner = settings.owner.includes(sender.replace('@s.whatsapp.net', ''))
    const dnd = loadDND()

    if (m.text?.startsWith('.dnd')) {
        if (!isOwner) return
        const args = m.text.split(' ')

        if (args[1] === 'on') {
            dnd.active = true
            dnd.replied = {}
            saveDND(dnd)
            await m.reply('DND aktif 🔕')
        }
        else if (args[1] === 'off') {
            dnd.active = false
            dnd.replied = {}
            saveDND(dnd)
            await m.reply('DND nonaktif 🔔')
        }
        else if (args[1] === 'set') {
            const pesan = args.slice(2).join(' ')
            if (!pesan) return m.reply('Contoh: .dnd set Lagi sibuk, nanti balas ya!')
            dnd.message = pesan
            saveDND(dnd)
            await m.reply(`Pesan DND diset: ${pesan}`)
        }
        return
    }

    if (!dnd.active) return
    if (m.isGroup) return
    if (m.key.fromMe) return
    if (sender === settings.owner[0] + '@s.whatsapp.net') return

    dnd.replied = dnd.replied || {}
    dnd.spam = dnd.spam || {}

    const count = (dnd.spam[sender] || 0) + 1
    dnd.spam[sender] = count
    saveDND(dnd)

    if (count > 3) {
        await alya.sendMessage(sender, { text: '⚠️ Jangan spam! Lagi DND, tunggu ya.' })
        return
    }

    if (!dnd.replied[sender]) {
        await alya.sendMessage(sender, { text: dnd.message })
        dnd.replied[sender] = true
        saveDND(dnd)
    }
}

module.exports = { handleDND }
