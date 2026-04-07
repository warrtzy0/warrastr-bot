const dndData = {}

async function handleDND(alya, m, settings) {
    const sender = m.sender
    console.log("SENDER:", sender, "OWNER:", settings.owner)
    const isOwner = settings.owner.includes(sender.replace('@s.whatsapp.net', ''))
    
    // command handler
    if (m.text?.startsWith('.dnd')) {
        if (!isOwner) return
        const args = m.text.split(' ')
        
        if (args[1] === 'on') {
            settings.dnd = settings.dnd || {}
            settings.dnd.active = true
            settings.dnd.replied = {}
            await m.reply('DND aktif 🔕')
        }
        else if (args[1] === 'off') {
            settings.dnd = settings.dnd || {}
            settings.dnd.active = false
            settings.dnd.replied = {}
            await m.reply('DND nonaktif 🔔')
        }
        else if (args[1] === 'set') {
            const pesan = args.slice(2).join(' ')
            if (!pesan) return m.reply('Contoh: .dnd set Lagi sibuk, nanti balas ya!')
            settings.dnd = settings.dnd || {}
            settings.dnd.message = pesan
            await m.reply(`Pesan DND diset: ${pesan}`)
        }
        return
    }

    // auto reply handler
    if (!settings.dnd?.active) return
    if (m.isGroup) return
    if (m.key.fromMe) return
    if (sender === settings.owner[0] + '@s.whatsapp.net') return

    settings.dnd.replied = settings.dnd.replied || {}
    settings.dnd.spam = settings.dnd.spam || {}

    const count = (settings.dnd.spam[sender] || 0) + 1
    settings.dnd.spam[sender] = count

    if (count > 3) {
        await alya.sendMessage(sender, { text: '⚠️ Jangan spam! Lagi DND, tunggu ya.' })
        return
    }

    if (!settings.dnd.replied[sender]) {
        const pesan = settings.dnd.message || 'Lagi DND, nanti balas ya! 🔕'
        await alya.sendMessage(sender, { text: pesan })
        settings.dnd.replied[sender] = true
    }
}

module.exports = { handleDND }
