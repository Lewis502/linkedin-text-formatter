/* LinkedIn Text Formatter — client-side logic */
(function(){
  const MAX_CHARS = 3000;
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const parseMd = document.getElementById('parseMd');
  const charCountEl = document.getElementById('charCount');
  const charLimitEl = document.getElementById('charLimit');
  const fancyPercentEl = document.getElementById('fancyPercent');
  const combiningCountEl = document.getElementById('combiningCount');
  const copyBtn = document.getElementById('copyBtn');
  const normalizeBtn = document.getElementById('normalizeBtn');
  const normalizeSelBtn = document.getElementById('normalizeSelBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusEl = document.getElementById('copyStatus');

  charLimitEl.textContent = MAX_CHARS.toString();

  // --- Unicode mapping helpers ---
  const A = 'A'.codePointAt(0), Z = 'Z'.codePointAt(0);
  const a = 'a'.codePointAt(0), z = 'z'.codePointAt(0);
  const zero = '0'.codePointAt(0), nine = '9'.codePointAt(0);

  // Style bases (Mathematical Alphanumeric Symbols)
  const BASES = {
    bold: { U: 0x1D400, L: 0x1D41A, D: 0x1D7CE },       // digits available
    italic: { U: 0x1D434, L: 0x1D44E, D: null },        // digits not available
    boldItalic: { U: 0x1D468, L: 0x1D482, D: null }     // digits not available
  };

  const UNDERLINE = '\u0332';
  const STRIKE = '\u0336';

  // Build forward & reverse maps
  function buildMaps(){
    const maps = {};
    const reverse = {};
    for(const [style, bases] of Object.entries(BASES)){
      const map = new Map();
      // Uppercase
      for(let cp=A; cp<=Z; cp++){
        map.set(String.fromCodePoint(cp), String.fromCodePoint(bases.U + (cp - A)));
      }
      // Lowercase
      for(let cp=a; cp<=z; cp++){
        map.set(String.fromCodePoint(cp), String.fromCodePoint(bases.L + (cp - a)));
      }
      // Digits (only if available)
      if(bases.D != null){
        for(let cp=zero; cp<=nine; cp++){
          map.set(String.fromCodePoint(cp), String.fromCodePoint(bases.D + (cp - zero)));
        }
      }
      maps[style] = map;

      // Populate reverse lookup for normalization
      for(const [plain, fancy] of map.entries()){
        reverse[fancy] = plain;
      }
    }
    return { maps, reverse };
  }

  const { maps, reverse } = buildMaps();

  function toStyled(input, style){
    const map = maps[style];
    if(!map) return input;
    const out = [];
    for (const ch of input){
      out.push(map.get(ch) || ch);
    }
    return out.join('');
  }

  function applyCombining(input, mark){
    const out = [];
    for(const ch of input){
      if(/\s/.test(ch)) { out.push(ch); }
      else { out.push(ch + mark); }
    }
    return out.join('');
  }

  function removeCombining(input){
    // strip all combining diacritics
    return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeText(input){
    // map our styled letters back to ASCII + remove combining
    let out = '';
    for(const ch of input){
      out += reverse[ch] || ch;
    }
    return removeCombining(out);
  }

  function updatePreview(){
    const text = editor.value;
    preview.textContent = text; // exact output pasted
    // counts
    const codePoints = Array.from(text);
    const total = codePoints.length;
    const fancy = codePoints.filter(cp => cp.codePointAt(0) > 127).length;
    const combining = (text.match(/[\u0300-\u036f]/g) || []).length;
    charCountEl.textContent = total;
    fancyPercentEl.textContent = total ? Math.round((fancy / total) * 100) : 0;
    combiningCountEl.textContent = combining;
    // simple near-limit hint in title
    if (total > MAX_CHARS) {
      charCountEl.style.color = '#ff6b6b';
    } else if (total > MAX_CHARS - 150) {
      charCountEl.style.color = '#ffd166';
    } else {
      charCountEl.style.color = '';
    }
  }

  function replaceSelection(transform){
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasSel = end > start;
    if(!hasSel) return;
    const before = editor.value.slice(0, start);
    const sel = editor.value.slice(start, end);
    const after = editor.value.slice(end);
    const nextSel = transform(sel);
    editor.value = before + nextSel + after;
    editor.focus();
    // restore selection to transformed text
    editor.selectionStart = start;
    editor.selectionEnd = start + nextSel.length;
    updatePreview();
  }

  // Toolbar bindings
  document.getElementById('boldBtn').addEventListener('click', () => replaceSelection(t => toStyled(t, 'bold')));
  document.getElementById('italicBtn').addEventListener('click', () => replaceSelection(t => toStyled(t, 'italic')));
  document.getElementById('boldItalicBtn').addEventListener('click', () => replaceSelection(t => toStyled(t, 'boldItalic')));
  document.getElementById('underlineBtn').addEventListener('click', () => replaceSelection(t => applyCombining(t, UNDERLINE)));
  document.getElementById('strikeBtn').addEventListener('click', () => replaceSelection(t => applyCombining(t, STRIKE)));
  document.getElementById('bulletsBtn').addEventListener('click', () => {
    replaceSelection(sel => sel.split(/\r?\n/).map(line => line.length ? '• ' + line : line).join('\n'));
  });
  document.getElementById('quotesBtn').addEventListener('click', () => replaceSelection(t => '“' + t + '”'));
  normalizeSelBtn.addEventListener('click', () => replaceSelection(normalizeText));

  // Keyboard shortcuts
  editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'b'){
      e.preventDefault();
      document.getElementById('boldBtn').click();
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'i'){
      e.preventDefault();
      document.getElementById('italicBtn').click();
    }
  });

  // Copy
  async function computeOutput(text){
    if (parseMd.checked){
      text = applyMiniMarkdown(text);
    }
    return text;
  }

  function applyMiniMarkdown(text){
    // Order matters: bold-italic, bold, italic, underline, strike
    // ***bold italic***
    text = text.replace(/\*\*\*([^\n*]+)\*\*\*/g, (_, s) => toStyled(s, 'boldItalic'));
    // **bold**
    text = text.replace(/\*\*([^\n*]+)\*\*\*/g, m => m); // protect *** already handled
    text = text.replace(/\*\*([^\n*]+)\*\*/g, (_, s) => toStyled(s, 'bold'));
    // *italic*
    text = text.replace(/\*([^\n*]+)\*/g, (_, s) => toStyled(s, 'italic'));
    // __underline__
    text = text.replace(/__([^\n_]+)__/g, (_, s) => applyCombining(s, UNDERLINE));
    // ~~strike~~
    text = text.replace(/~~([^~\n]+)~~/g, (_, s) => applyCombining(s, STRIKE));
    return text;
  }

  async function doCopy(){
    statusEl.textContent = '';
    let text = editor.value;
    text = await computeOutput(text);
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
      }else{
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      statusEl.textContent = 'Copied! Paste into your LinkedIn post.';
    }catch(err){
      statusEl.textContent = 'Copy failed. Select all and copy manually.';
      console.error(err);
    }
  }

  copyBtn.addEventListener('click', doCopy);
  normalizeBtn.addEventListener('click', () => {
    editor.value = normalizeText(editor.value);
    updatePreview();
  });
  clearBtn.addEventListener('click', () => {
    editor.value = '';
    updatePreview();
    editor.focus();
  });

  editor.addEventListener('input', updatePreview);
  updatePreview();
})();