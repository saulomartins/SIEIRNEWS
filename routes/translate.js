const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text, target } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text_required' });
    const tl = target || 'pt';

    const resp = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: { client: 'gtx', sl: 'auto', tl, dt: 't', q: text },
      timeout: 10000
    });

    const data = resp.data;
    let translated = text;
    if (Array.isArray(data) && Array.isArray(data[0])) {
      translated = data[0].map(p => p[0]).join('');
    }

    res.json({ translated });
  } catch (err) {
    console.error('[API /translate] Erro:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'translation_failed' });
  }
});

module.exports = router;
