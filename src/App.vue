<template>
  <div class="vue-dashboard">
    <header class="vue-header">
      <h2>SIEIR Vue Dashboard</h2>
      <div>
        <button @click="saveLayout">Salvar Layout</button>
        <button @click="loadLayout">Carregar Layout</button>
      </div>
    </header>

    <div class="grid-stack" ref="gridRoot">
      <div class="grid-stack-item" data-gs-x="0" data-gs-y="0" data-gs-width="4" data-gs-height="6" data-id="nasdaq">
        <div class="grid-stack-item-content"><NasdaqPanel /></div>
      </div>
      <div class="grid-stack-item" data-gs-x="4" data-gs-y="0" data-gs-width="4" data-gs-height="6" data-id="metals">
        <div class="grid-stack-item-content"><MetalsPanel /></div>
      </div>
      <div class="grid-stack-item" data-gs-x="8" data-gs-y="0" data-gs-width="4" data-gs-height="6" data-id="indices">
        <div class="grid-stack-item-content"><IndicesPanel /></div>
      </div>
      <div class="grid-stack-item" data-gs-x="0" data-gs-y="6" data-gs-width="12" data-gs-height="8" data-id="news">
        <div class="grid-stack-item-content"><NewsPanel /></div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { GridStack } from 'gridstack'
import NasdaqPanel from './components/NasdaqPanel.vue'
import MetalsPanel from './components/MetalsPanel.vue'
import IndicesPanel from './components/IndicesPanel.vue'
import NewsPanel from './components/NewsPanel.vue'

export default {
  components: { NasdaqPanel, MetalsPanel, IndicesPanel, NewsPanel },
  setup() {
    const gridRoot = ref(null)
    let grid = null

    function saveLayout() {
      if (!grid) return
      const layout = grid.save(false)
      localStorage.setItem('gridLayout', JSON.stringify(layout))
      console.log('Layout salvo')
    }

    function loadLayout() {
      const raw = localStorage.getItem('gridLayout')
      if (!raw || !grid) return
      try {
        const layout = JSON.parse(raw)
        grid.removeAll()
        grid.load(layout)
        console.log('Layout carregado')
      } catch (e) { console.error(e) }
    }

    onMounted(() => {
      grid = GridStack.init({ float: true, resizable: { handles: 'se, sw' } }, gridRoot.value)
      // ensure items are initialized
      saveLayout()
    })

    return { gridRoot, saveLayout, loadLayout }
  }
}
</script>

<style>
.vue-header{display:flex;justify-content:space-between;align-items:center;padding:12px}
.grid-stack{min-height:400px}
</style>
