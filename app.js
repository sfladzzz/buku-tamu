const express = require('express')
const sqlite3 = require('sqlite3')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000

// Render: set DATABASE_PATH=/var/data/tamu.db after attaching a persistent disk.
// Local development: use ./database/tamu.db.
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'database', 'tamu.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })

const db = new sqlite3.Database(databasePath, (err) => {
    if (err) {
        console.error('Gagal membuka database:', err.message)
        process.exit(1)
    }
})

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))

db.run(`CREATE TABLE IF NOT EXISTS tamu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    pesan TEXT NOT NULL
)`, (err) => {
    if (err) {
        console.error('Gagal menyiapkan tabel tamu:', err.message)
        process.exit(1)
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server berjalan pada port ${PORT}`)
        console.log(`Database: ${databasePath}`)
    })
})

// Halaman utama
app.get('/', (req, res) => {
    db.all('SELECT * FROM tamu ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            console.error('Gagal mengambil data tamu:', err.message)
            return res.status(500).send('Gagal memuat data buku tamu.')
        }

        res.render('index', { data: rows })
    })
})

// Menyimpan pesan
app.post('/kirim', (req, res) => {
    const nama = (req.body.nama || '').trim()
    const pesan = (req.body.pesan || '').trim()

    if (!nama || !pesan) {
        return res.status(400).send('Nama dan pesan wajib diisi.')
    }

    db.run(
        'INSERT INTO tamu (nama, pesan) VALUES (?, ?)',
        [nama, pesan],
        function (err) {
            if (err) {
                console.error('Gagal menyimpan pesan:', err.message)
                return res.status(500).send('Gagal menyimpan pesan.')
            }

            res.redirect('/')
        }
    )
})

// Menghapus pesan
app.post('/delete/:id', (req, res) => {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send('ID pesan tidak valid.')
    }

    db.run('DELETE FROM tamu WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Gagal menghapus pesan:', err.message)
            return res.status(500).send('Gagal menghapus entri.')
        }

        res.redirect('/')
    })
})

app.use((req, res) => {
    res.status(404).send('Halaman tidak ditemukan.')
})

process.on('SIGTERM', () => {
    db.close((err) => {
        if (err) console.error('Gagal menutup database:', err.message)
        process.exit(err ? 1 : 0)
    })
})
