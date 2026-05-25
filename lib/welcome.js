const fs = require('fs')
const axios = require('axios')
const moment = require('moment-timezone')

const { isSetWelcome, getTextSetWelcome } = require('./setwelcome')
const { isSetLeft, getTextSetLeft } = require('./setleft')

const { jidNormalizedUser } = require('socketon')

const loadJsonSafe = (path, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path))
  } catch (e) {
    return fallback
  }
}

let set_welcome_db = loadJsonSafe('./database/set_welcome.json', [])
let set_left_db = loadJsonSafe('./database/set_left.json', [])
let setting = loadJsonSafe('./config.json', {})

fs.watchFile('./database/set_welcome.json', () => {
  set_welcome_db = loadJsonSafe('./database/set_welcome.json', [])
})

fs.watchFile('./database/set_left.json', () => {
  set_left_db = loadJsonSafe('./database/set_left.json', [])
})

fs.watchFile('./config.json', () => {
  setting = loadJsonSafe('./config.json', {})
})

module.exports.welcome = async (iswel, isleft, alya, anu) => {
  try {

    const metadata = await alya.groupMetadata(anu.id)
    const participants = anu.participants
    const groupName = metadata.subject
    const memberCount = metadata.participants.length
    const groupDesc = metadata.desc || "-"

    const fallbackImage = "https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg"

    for (let num of participants) {

      const user = jidNormalizedUser(num)

      let pp_user
      try {
        pp_user = await alya.profilePictureUrl(user, 'image')
      } catch {
        pp_user = fallbackImage
      }

      const pushName = num.split('@')[0]

      /* ================= WELCOME ================= */

      if (anu.action === 'add' && (iswel || setting.auto_welcomeMsg)) {

        if (isSetWelcome(anu.id, set_welcome_db)) {

          const get_teks = await getTextSetWelcome(anu.id, set_welcome_db)

          const replaced = get_teks
            .replace(/@user/gi, `@${pushName}`)
            .replace(/@group/gi, groupName)
            .replace(/@desc/gi, groupDesc)

          await alya.sendMessage(anu.id, {
            text: replaced,
            mentions: [num]
          })

        } else {

          const welcomeUrl =
            `https://api.siputzx.my.id/api/canvas/welcomev5?` +
            `username=${pushName}` +
            `&guildName=${encodeURIComponent(groupName)}` +
            `&memberCount=${memberCount}` +
            `&avatar=${encodeURIComponent(pp_user)}` +
            `&background=${encodeURIComponent('https://raw.githubusercontent.com/yuusuke1101/Yuugames/refs/heads/main/Alisa%20Mikahilovna%20Kujou%20(Alya).jpg')}` +
            `&quality=50`

          await alya.sendMessage(anu.id, {

text:
`╭─❖ 「 *WELCOME* 」 ❖
│ 👋 Halo @${pushName}
│
│ Selamat datang di
│ *${groupName}*
│
│ 📊 Member ke : ${memberCount}
│
│ Silahkan baca deskripsi grup
│ dan patuhi semua aturan ya!
╰───────────────`,

            contextInfo: {
              mentionedJid: [num],
              externalAdReply: {
                title: `Welcome To ${groupName}`,
                body: `Member ke ${memberCount}`,
                thumbnailUrl: welcomeUrl,
                sourceUrl: "https://whatsapp.com/channel/0029Vb6rCGN1iUxVlXtqp707",
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: false
              }
            }

          })

        }

      }

      /* ================= LEAVE ================= */

      else if (anu.action === 'remove' && (isleft || setting.auto_leaveMsg)) {

        if (isSetLeft(anu.id, set_left_db)) {

          const get_teks = await getTextSetLeft(anu.id, set_left_db)

          const replaced = get_teks
            .replace(/@user/gi, `@${pushName}`)
            .replace(/@group/gi, groupName)
            .replace(/@desc/gi, groupDesc)

          await alya.sendMessage(anu.id, {
            text: replaced,
            mentions: [num]
          })

        } else {

          const goodbyeUrl =
            `https://api.siputzx.my.id/api/canvas/goodbyev2?` +
            `username=${pushName}` +
            `&guildName=${encodeURIComponent(groupName)}` +
            `&memberCount=${memberCount}` +
            `&avatar=${encodeURIComponent(pp_user)}` +
            `&background=${encodeURIComponent('https://raw.githubusercontent.com/yuusuke1101/Yuugames/refs/heads/main/Alisa%20Mikahilovna%20Kujou%20(Alya).jpg')}`

          await alya.sendMessage(anu.id, {

text:
`╭─❖ 「 *GOODBYE* 」 ❖
│ 👋 Sampai jumpa
│ @${pushName}
│
│ Terima kasih sudah
│ pernah berada di
│ *${groupName}*
╰───────────────`,

            contextInfo: {
              mentionedJid: [num],
              externalAdReply: {
                title: `See yaa Dari ${groupName}`,
                body: `Member tersisa ${memberCount}`,
                thumbnailUrl: goodbyeUrl,
                sourceUrl: "https://whatsapp.com/channel/0029Vb6rCGN1iUxVlXtqp707",
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: false
              }
            }

          })

        }

      }

      /* ================= PROMOTE ================= */

      else if (anu.action === 'promote') {

        await alya.sendMessage(anu.id, {
          text:
`🎉 *PROMOTE MEMBER*

Selamat kepada
@${pushName}

Sekarang kamu menjadi
*ADMIN* di grup

*${groupName}*`,
          mentions: [num]
        })

      }

      /* ================= DEMOTE ================= */

      else if (anu.action === 'demote') {

        await alya.sendMessage(anu.id, {
          text:
`⚠️ *STATUS MEMBER*

@${pushName}
sekarang kembali menjadi
*MEMBER*

di grup
*${groupName}*`,
          mentions: [num]
        })

      }

    }

  } catch (err) {
    console.error(err)
  }
}