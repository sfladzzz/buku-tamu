const express = require('express')
const sqlite3 = require('sqlite3')
const path = require ('path')

const app = express()
const PORT = 3000 

const db = new sqlite3.Database('./database/tamu.db')

db.serialize (() => {
    db.run(`CREATE TABLE IF NOT EXISTS tamu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT,
        pesan TEXT
        )`)
})

app.set ('view engine', 'ejs')
app.set ('views', path.join (__dirname, 'views'))
app.use (express.urlencoded({extended: true}))

//halaman utama
app.get ('/', (req, res) => {
    db.all ("SELECT * FROM tamu ORDER BY id DESC", [], (err, rows) => {
        res.render('index', {data: rows})
    })
})

//simpan data
app.post ('/kirim', (req, res) => {
    const {nama, pesan}  = req.body
    db.run("INSERT INTO tamu (nama, pesan) VALUES (?, ?)", [nama, pesan], () => {
        res.redirect('/')
    })
})

// POST: Menghapus entri
app.post('/delete/:id', (req, res) => {
  const id = req.params.id; // Ambil ID dari URL parameter

  db.run("DELETE FROM tamu WHERE id = ?", id, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Gagal menghapus entri.');
    }
    console.log(`A row with ID ${id} has been deleted.`);
    res.redirect('/'); // Redirect kembali ke halaman utama
  });
});

app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`)
})