const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(global.supaurl, global.supakey)
const BUCKET = 'session'
const SESSION_DIR = './Alyachan'

async function uploadSession() {
    try {
        const files = fs.readdirSync(SESSION_DIR)
        for (const file of files) {
            const filePath = path.join(SESSION_DIR, file)
            const fileBuffer = fs.readFileSync(filePath)
            await supabase.storage.from(BUCKET).upload(file, fileBuffer, { upsert: true })
        }
        console.log('✅ Session uploaded to Supabase')
    } catch (err) {
        console.log('❌ Upload session error:', err.message)
    }
}

async function downloadSession() {
    try {
        if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
        const { data, error } = await supabase.storage.from(BUCKET).list()
        if (error || !data?.length) return console.log('⚠️ No session found')
        for (const file of data) {
            const { data: fileData } = await supabase.storage.from(BUCKET).download(file.name)
            const buffer = Buffer.from(await fileData.arrayBuffer())
            fs.writeFileSync(path.join(SESSION_DIR, file.name), buffer)
        }
        console.log('✅ Session downloaded from Supabase')
    } catch (err) {
        console.log('❌ Download session error:', err.message)
    }
}

module.exports = { uploadSession, downloadSession }
