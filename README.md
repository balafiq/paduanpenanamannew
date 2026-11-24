# Tanya Pakej Teknologi Tanaman

Chatbot soal jawab berdasarkan buku Pakej Teknologi (Jabatan Pertanian) untuk 14 tanaman.
Jawapan diambil daripada buku tanaman yang dipilih sahaja, dengan rujukan nombor halaman.

## Struktur

| Fail | Fungsi |
|---|---|
| `index.html` | Laman web (GitHub Pages) |
| `data/*.json` | Teks buku setiap tanaman, ikut halaman |
| `config.js` | URL proksi AI (`window.API_URL`) |
| `worker/` | Proksi Cloudflare Worker yang memanggil Claude API (kunci API disimpan di sini) |

## Kenapa perlu proksi?

GitHub Pages hanya hos fail statik. Untuk jawab soalan, laman perlu panggil Claude API, dan
kunci API **tidak boleh** diletak dalam `index.html` (sesiapa boleh lihat dan guna). Jadi kunci
disimpan dalam Cloudflare Worker (percuma untuk penggunaan kecil), dan laman panggil Worker itu.

Kalau `API_URL` kosong, laman masih berfungsi dalam **mod carian**: ia tunjuk halaman buku yang berkaitan, tanpa jawapan AI.

## Langkah pemasangan

### 1. Dapatkan kunci API Anthropic
Daftar di https://platform.claude.com, tambah kredit, dan cipta API key.

### 2. Deploy Worker (sekali sahaja)
Perlu Node.js dan akaun Cloudflare (percuma).

```bash
cd worker
```

```bash
npx wrangler login
```

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

```bash
npx wrangler deploy
```

Wrangler akan beri URL seperti `https://tanya-tanaman.<nama-anda>.workers.dev`.
Semak `ALLOWED_ORIGINS` dalam `worker/wrangler.toml` sama dengan alamat GitHub Pages anda
(contoh `https://balafiq.github.io`).

### 3. Masukkan URL Worker ke `config.js`

```js
window.API_URL = "https://tanya-tanaman.<nama-anda>.workers.dev";
```

### 4. Hidupkan GitHub Pages
Repo → **Settings → Pages** → Source: *Deploy from a branch* → pilih branch dan folder `/ (root)`.

## Kos dan keselamatan

- Model ditetapkan dalam `worker/worker.js` (`MODEL`). Untuk kos lebih rendah, tukar ke `claude-haiku-5-5`.
- Worker hanya terima permintaan daripada alamat dalam `ALLOWED_ORIGINS` dan hanya benarkan alat carian buku.
  Ini tidak menghalang sepenuhnya penyalahgunaan; tetapkan had perbelanjaan bulanan di Claude Console,
  dan pertimbangkan Rate Limiting Rules di Cloudflare.
