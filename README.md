# LinkedIn Text Formatter

A tiny, zero‑dependency web app that lets you write, style, and copy **Unicode‑formatted** text that pastes cleanly into LinkedIn posts.

> LinkedIn’s post composer strips HTML/RTF, so this app uses *Unicode look‑alike characters* (e.g., Mathematical Alphanumeric Symbols) and combining marks for underline/strikethrough. Because the output is plain text, the styling survives copy‑paste into a LinkedIn **post**.

## Features
- Bold, Italic, Bold‑Italic (Unicode letter mapping)
- Underline, Strikethrough (combining marks)
- Bullets and quick quotes
- Optional mini‑Markdown parsing on copy: `***bold italic***`, `**bold**`, `*italic*`, `__underline__`, `~~strike~~`
- Live character counter (defaults to 3,000), combining mark count, and % of non‑ASCII
- Normalize to plain text (revert fancy letters, remove combining marks)
- Clean, responsive UI. 100% client‑side.

## Quick start
1. Open `index.html` in a browser and start typing.
2. Select text and use the toolbar to style; or enable **Parse Markdown** and type with `*`/`**`/`***`, `__`, `~~`.
3. Press **Copy formatted** and paste into a LinkedIn **post**.

> Use styling sparingly. Fancy Unicode can hurt accessibility and search. The **Normalize** button converts everything back to plain text.

## Project structure
```
LinkedInTextFormatter/
├── index.html
├── styles.css
├── app.js
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── .gitignore
```

## Local development
No build needed. Just open `index.html`. If you prefer a local server:
```bash
# Python 3
python -m http.server 5173
# then visit http://localhost:5173
```

## Deploy to GitHub Pages
- Push this folder to a public GitHub repo.
- In **Settings → Pages**, set **Branch** to `main` and **Folder** to `/ (root)`.
- Your site will be available at: `https://<username>.github.io/<repo>/`

## License
[MIT](./LICENSE)
