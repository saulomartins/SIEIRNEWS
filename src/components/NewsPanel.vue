<template>
  <div class="panel">
    <div class="panel-header">
      <span>🔴 SEIER News</span>
      <div class="news-controls">
        <button class="btn-news" @click="toggleNotifications" title="Notificações">🔔</button>
        <button class="btn-news" @click="toggleSound" title="Som">{{ newsSoundEnabled ? '🔊' : '🔇' }}</button>
      </div>
    </div>

    <div class="news-controls-bar">
      <button @click="decreaseFontSize">-</button>
      <button @click="increaseFontSize">+</button>
      <button @click="toggleTranslation">{{ newsTranslated ? 'Original' : 'Traduzir' }}</button>
      <button @click="showKeywordsModal = true" title="Palavras-chave">🔑</button>
      <button @click="manualRefreshNews">🔄</button>
    </div>

    <div class="news-feed" :style="{ fontSize: newsFontSize + 'px' }">
      <div v-if="loadingNews" class="loading">Carregando notícias...</div>
      <div v-else-if="displayNews.length === 0" class="no-news">Nenhuma notícia disponível</div>
      <div v-else v-for="(item, idx) in displayNews" :key="item.id || item.url || idx" class="news-item">
        <span class="news-time">{{ item.time || item.fullDate || 'Recente' }}</span>
        <div class="news-text" v-html="highlightKeywords(item.title)"></div>
        <div class="news-source">{{ item.source || 'Fonte' }}</div>
        <a v-if="item.url" :href="item.url" target="_blank" rel="noopener">Ler mais →</a>
      </div>
    </div>

    <!-- Keywords Modal -->
    <div v-if="showKeywordsModal" class="modal-overlay" @click.self="showKeywordsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔑 Palavras-Chave</h3>
          <button @click="showKeywordsModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <input v-model="newKeyword" @keyup.enter="addKeyword" placeholder="Palavra-chave..." />
            <button @click="addKeyword">Adicionar</button>
          </div>
          <div class="keywords-list">
            <div v-for="kw in keywords" :key="kw" class="keyword-item">
              <span>{{ kw }}</span>
              <button @click="removeKeyword(kw)">Remover</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import dataService from '../services/dataService';

export default {
  name: 'NewsPanel',
  setup() {
    const loadingNews = ref(false);
    const originalNews = ref([]);
    const translatedNews = ref([]);
    const newsTranslated = ref(false);
    const isTranslating = ref(false);
    const newsFontSize = ref(14);
    const showKeywordsModal = ref(false);
    const keywords = ref([]);
    const newKeyword = ref('');
    const newsSoundEnabled = ref(true);

    function saveTranslatedNews(arr) {
      try { localStorage.setItem('translatedNews', JSON.stringify(arr)); } catch (e) { console.error(e); }
    }
    function loadTranslatedNews() {
      try { const d = localStorage.getItem('translatedNews'); return d ? JSON.parse(d) : []; } catch (e) { return []; }
    }

    function loadKeywords() {
      try { const s = localStorage.getItem('newsKeywords'); keywords.value = s ? JSON.parse(s) : []; } catch (e) { keywords.value = []; }
    }
    function saveKeywords() { try { localStorage.setItem('newsKeywords', JSON.stringify(keywords.value)); } catch (e) {} }
    function addKeyword() {
      const kw = newKeyword.value.trim().toLowerCase();
      if (kw && !keywords.value.includes(kw)) { keywords.value.push(kw); saveKeywords(); newKeyword.value = ''; }
    }
    function removeKeyword(kw) { keywords.value = keywords.value.filter(k => k !== kw); saveKeywords(); }

    function containsKeyword(text) {
      if (!text || keywords.value.length === 0) return false;
      const lower = text.toLowerCase();
      return keywords.value.some(k => lower.includes(k));
    }

    function highlightKeywords(text) {
      if (!text) return '';
      let out = text;
      keywords.value.forEach(k => {
        try { const re = new RegExp(`(${k})`, 'gi'); out = out.replace(re, '<mark>$1</mark>'); } catch (e) {}
      });
      return out;
    }

    function playNewsSound() {
      if (!newsSoundEnabled.value) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(1047, ctx.currentTime);
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        o.connect(g); g.connect(ctx.destination); o.start();
        o.frequency.linearRampToValueAtTime(1568, ctx.currentTime + 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        o.stop(ctx.currentTime + 0.18);
        setTimeout(()=>ctx.close(),250);
      } catch (e) { console.error('Audio error', e); }
    }

    async function fetchNews() {
      loadingNews.value = true;
      try {
        const res = await dataService.getNews();
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res.data && Array.isArray(res.data)) list = res.data;
        else if (res.news && Array.isArray(res.news)) list = res.news;
        // sort by date if possible
        list.sort((a,b)=>{ const da=new Date(a.pubDate||a.fullDate||a.time||0); const db=new Date(b.pubDate||b.fullDate||b.time||0); return db-da; });
        if (list.length>0) { playNewsSound(); originalNews.value = list; }
      } catch (e) { console.error('Erro ao buscar notícias:', e); }
      finally { loadingNews.value = false; }
    }

    async function translateText(text) {
      try {
        const resp = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
        const data = await resp.json();
        if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) return data[0][0][0];
        return text;
      } catch (e) { console.error('translate error', e); return text; }
    }

    async function toggleTranslation() {
      if (isTranslating.value) return;
      if (newsTranslated.value) {
        newsTranslated.value = false;
      } else {
        if (originalNews.value.length === 0) return;
        isTranslating.value = true;
        try {
          const saved = loadTranslatedNews();
          const map = {};
          saved.forEach(n=>{ const key = n.id||n.url||n.title; if (key) map[key]=n; });
          const promises = originalNews.value.map(async (n)=>{
            const key = n.id||n.url||n.title;
            if (map[key] && map[key].originalTitle===n.title) return map[key];
            const t = await translateText(n.title||'');
            return {...n, originalTitle:n.title, title:t};
          });
          translatedNews.value = await Promise.all(promises);
          newsTranslated.value = true;
          saveTranslatedNews(translatedNews.value);
        } catch (e) { console.error(e); }
        finally { isTranslating.value = false; }
      }
    }

    function manualRefreshNews() { fetchNews(); }

    function increaseFontSize() { if (newsFontSize.value<24) newsFontSize.value++; }
    function decreaseFontSize() { if (newsFontSize.value>10) newsFontSize.value--; }

    function toggleSound() { newsSoundEnabled.value = !newsSoundEnabled.value; }
    function toggleNotifications(){ /* placeholder */ }

    const displayNews = ref([]);
    onMounted(async ()=>{
      loadKeywords();
      const savedTrans = loadTranslatedNews();
      if (savedTrans && savedTrans.length>0) translatedNews.value = savedTrans;
      await fetchNews();
      displayNews.value = newsTranslated.value && translatedNews.value.length>0 ? translatedNews.value : originalNews.value;
    });

    return {
      loadingNews, originalNews, translatedNews, newsTranslated, isTranslating,
      newsFontSize, showKeywordsModal, keywords, newKeyword, newsSoundEnabled,
      addKeyword, removeKeyword, highlightKeywords, manualRefreshNews,
      toggleTranslation, increaseFontSize, decreaseFontSize, toggleSound,
      displayNews
    };
  }
};
</script>

<style scoped>
.news-controls { display:flex; gap:8px; }
.news-controls-bar { display:flex; gap:8px; margin:8px 0; }
.news-feed { max-height: 60vh; overflow:auto; }
.news-item { padding:8px; border-bottom:1px solid #eee; }
.modal-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); }
.modal-content { background:#fff; padding:1rem; width:400px; border-radius:6px; }
</style><template>
  <div class="panel news-panel">
    <div class="panel-header-news">
      <i class="bi bi-square-fill icon-red"></i>
      <span>SEIER News</span>
      <div class="news-controls">
        <button @click="toggleNotifications" :class="{'btn-news-off': !notificationsEnabled}" class="btn-news"><i class="bi bi-bell"></i> Notificação</button>
        <button @click="toggleSound" :class="{'btn-news-off': !newsSoundEnabled}" class="btn-news"><i class="bi" :class="newsSoundEnabled ? 'bi-volume-up' : 'bi-volume-mute'"></i> Som</button>
        <button @click="refreshNews" class="btn-news"><i class="bi bi-arrow-clockwise"></i> Atualizar</button>
      </div>
    </div>

    <div class="news-container">
      <div class="news-controls-left">
        <button class="btn-news-ctrl" @click="decreaseFont">-</button>
        <button class="btn-news-ctrl" @click="increaseFont">+</button>
        <button class="btn-news-ctrl" @click="toggleTranslation">{{ newsTranslated ? 'Original' : 'Traduzir' }}</button>
        <button class="btn-news-ctrl" @click="openKeywordsModal"><i class="bi bi-key-fill"></i></button>
      </div>

      <div class="news-feed" :style="{'font-size': fontSize + 'px'}">
        <div v-if="loading" class="news-item"><span class="news-text">Carregando notícias...</span></div>
        <div v-else-if="newsList.length===0" class="news-item"><span class="news-text">Nenhuma notícia disponível</span></div>
        <div v-else>
          <div v-for="(n, idx) in displayedNews" :key="n.id || n.url || idx" :class="['news-item', containsKeyword(n.title) ? 'news-item-highlighted' : '']">
            <span class="news-time" :title="n.fullDate || n.time">{{ n.fullDate || n.time || 'Recente' }}</span>
            <span class="news-text">
              <a v-if="n.url" :href="n.url" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">{{ n.title }}</a>
              <span v-else>{{ n.title }}</span>
              <div v-if="n.stocks && n.stocks.length" class="news-stocks">
                <span v-for="s in n.stocks" :key="s" class="stock-tag">{{ s }}</span>
              </div>
            </span>
            <span class="news-source">{{ n.source || 'Unknown' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Keywords modal -->
    <div v-if="showKeywordsModal" class="keywords-modal" style="display:flex">
      <div class="keywords-modal-content">
        <div class="keywords-modal-header">
          <h3><i class="bi bi-key-fill"></i> Palavras-Chave</h3>
          <button class="btn-close-modal" @click="showKeywordsModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="keywords-modal-body">
          <div class="keywords-input-group">
            <input v-model="keywordInput" placeholder="Digite uma palavra-chave..." @keyup.enter="addKeywordFromInput" />
            <button @click="addKeywordFromInput" class="btn-add-keyword">Adicionar</button>
          </div>
          <div class="keywords-list">
            <div v-if="keywords.length===0" style="color:#666;padding:1rem;text-align:center">Nenhuma palavra-chave adicionada</div>
            <div v-for="k in keywords" :key="k" class="keyword-item">
              <span class="keyword-text">{{ k }}</span>
              <button class="btn-remove-keyword" @click="removeKeyword(k)"><i class="bi bi-trash"></i> Remover</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const API_URL = 'http://localhost:3000/api'
const token = localStorage.getItem('token')

const newsList = ref([])
const originalNews = ref([])
const translatedNews = ref([])
const newsTranslated = ref(false)
const isTranslating = ref(false)
const loading = ref(true)
const newsSoundEnabled = ref(true)
const notificationsEnabled = ref(false)
const keywords = ref([])
const showKeywordsModal = ref(false)
const keywordInput = ref('')
const fontSize = ref(14)

let newsInterval = null

function saveTranslatedNews(arr){ try{ localStorage.setItem('translatedNews', JSON.stringify(arr)) }catch(e){console.error(e)} }
function loadTranslatedNews(){ try{ const d=localStorage.getItem('translatedNews'); return d?JSON.parse(d):[] }catch(e){console.error(e); return []}}

function loadKeywords(){ try{ const s=localStorage.getItem('newsKeywords'); if(s){ keywords.value = JSON.parse(s); } }catch(e){ console.error(e)} }
function saveKeywords(){ try{ localStorage.setItem('newsKeywords', JSON.stringify(keywords.value)) }catch(e){console.error(e)} }

function containsKeyword(text){ if(!text || keywords.value.length===0) return false; const t=text.toLowerCase(); return keywords.value.some(k=>t.includes(k)); }

function addKeywordFromInput(){ const k=keywordInput.value.trim().toLowerCase(); if(k && !keywords.value.includes(k)){ keywords.value.push(k); saveKeywords(); keywordInput.value=''; } }
function removeKeyword(k){ keywords.value = keywords.value.filter(x=>x!==k); saveKeywords(); }
function openKeywordsModal(){ showKeywordsModal.value = true }

function playNewsSound(){ if(!newsSoundEnabled.value) return; try{ const ctx = new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='triangle'; o.frequency.setValueAtTime(1047, ctx.currentTime); g.gain.setValueAtTime(0.25, ctx.currentTime); o.connect(g); g.connect(ctx.destination); o.start(); o.frequency.linearRampToValueAtTime(1568, ctx.currentTime+0.12); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.18); o.stop(ctx.currentTime+0.18); setTimeout(()=>ctx.close(),250);}catch(e){console.error('Sound error',e)} }

async function translateText(text){ try{ const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`); const data = await response.json(); if(Array.isArray(data)&&Array.isArray(data[0])&&Array.isArray(data[0][0])) return data[0][0][0]; return text }catch(e){ console.error('Erro ao traduzir',e); return text } }

async function toggleTranslation(){ if(isTranslating.value) return; if(newsTranslated.value){ newsTranslated.value=false; localStorage.setItem('newsTranslated','false'); return } if(originalNews.value.length===0) return; isTranslating.value=true; try{ const saved = loadTranslatedNews(); const map = {}; saved.forEach(n=>{ const key = n.id||n.url||n.title; if(key) map[key]=n }); const promises = originalNews.value.map(async news=>{ const key = news.id||news.url||news.title; if(map[key] && map[key].originalTitle===news.title) return map[key]; const t = await translateText(news.title); return {...news, originalTitle: news.title, title: t } }); translatedNews.value = await Promise.all(promises); newsTranslated.value=true; localStorage.setItem('newsTranslated','true'); saveTranslatedNews(translatedNews.value); }catch(e){console.error('Erro tradução',e)} finally{ isTranslating.value=false } }

async function fetchNews(){ try{ loading.value=true; const resp = await fetch(`${API_URL}/data/news`, { headers: { 'Authorization': `Bearer ${token}` } }); if(!resp.ok) throw new Error('HTTP '+resp.status); const nd = await resp.json(); let incoming = []; if(Array.isArray(nd)) incoming = nd; else if(nd.data && Array.isArray(nd.data)) incoming = nd.data; else { console.warn('Formato inesperado', nd); newsList.value=[]; loading.value=false; return } incoming.sort((a,b)=> new Date(b.pubDate||b.fullDate||b.time||0) - new Date(a.pubDate||a.fullDate||a.time||0)); function isSame(a,b){ if(a.id&&b.id) return a.id===b.id; if(a.url&&b.url) return a.url===b.url; return a.title===b.title } const newItems = incoming.filter(n=>!originalNews.value.some(o=>isSame(n,o))); if(newItems.length>0){ playNewsSound(); originalNews.value = newItems.concat(originalNews.value); originalNews.value.sort((a,b)=> new Date(b.pubDate||b.fullDate||b.time||0) - new Date(a.pubDate||a.fullDate||a.time||0)); if(newsTranslated.value){ const translatedNew = await Promise.all(newItems.map(async n=>{ const t = await translateText(n.title); return {...n, originalTitle: n.title, title: t } })); translatedNews.value = translatedNew.concat(translatedNews.value); saveTranslatedNews(translatedNews.value); } newsList.value = newsTranslated.value ? translatedNews.value.slice() : originalNews.value.slice(); } if(newsList.value.length===0) newsList.value = (newsTranslated.value ? translatedNews.value : originalNews.value).slice(); loading.value=false; }catch(e){ console.error('Erro buscar notícias',e); loading.value=false } }

function refreshNews(){ fetchNews() }
function toggleSound(){ newsSoundEnabled.value = !newsSoundEnabled.value }
function toggleNotifications(){ notificationsEnabled.value = !notificationsEnabled.value }
function decreaseFont(){ if(fontSize.value>10) fontSize.value-- }
function increaseFont(){ if(fontSize.value<24) fontSize.value++ }

const displayedNews = computed(()=> newsTranslated.value ? translatedNews.value : originalNews.value )

onMounted(()=>{
  loadKeywords();
  translatedNews.value = loadTranslatedNews();
  const savedTrans = localStorage.getItem('newsTranslated'); if(savedTrans==='true') newsTranslated.value=true;
  // initial load
  fetchNews();
  newsInterval = setInterval(fetchNews, 1000);
})

onBeforeUnmount(()=>{ if(newsInterval) clearInterval(newsInterval) })

</script>

<style scoped>
.panel{background:#fff;padding:8px;border-radius:4px;border:1px solid #ddd}
.panel-header-news{display:flex;align-items:center;justify-content:space-between}
.news-controls button{margin-left:6px}
.news-feed{margin-top:8px}
.news-item{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0}
.news-item-highlighted{background:linear-gradient(90deg, rgba(255,250,200,0.6), transparent)}
.news-time{color:#999;width:90px}
.news-text{flex:1}
.news-source{color:#666;font-size:0.85em;margin-left:8px}
.news-stocks{margin-top:6px}
.stock-tag{background:#eee;padding:2px 6px;border-radius:3px;margin-right:4px;font-size:0.85em}
.keywords-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)}
.keywords-modal-content{background:#fff;padding:12px;border-radius:6px;min-width:320px}
.keywords-input-group{display:flex;gap:8px}
.keywords-list{margin-top:8px}
.keyword-item{display:flex;justify-content:space-between;align-items:center;padding:6px 0}
</style>
