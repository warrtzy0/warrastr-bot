const fs = require('fs')
const dndFile = './database/dnd.json'

const getDnd = () => {
    if (!fs.existsSync(dndFile)) fs.writeFileSync(dndFile, JSON.stringify({ active: false, pesan: 'Maaf, lagi sibuk! Nanti dibalas ya 🙏' }))
    return JSON.parse(fs.readFileSync(dndFile))
}

const setDnd = (data) => fs.writeFileSync(dndFile, JSON.stringify(data))

module.exports = { getDnd, setDnd }
