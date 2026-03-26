// ══════════════════════════════════════════════════════════════
// DA-2026 · RUTA MODULE — Excel Technical Simulator (Stub)
// Module 4-RUT: PLANNED — Architecture ready for next sprint
// ══════════════════════════════════════════════════════════════
const ExcelDojo = {
  ready: false,

  init(){
    const el = document.getElementById('excelDojoStub');
    if(!el) return;
    el.innerHTML = `
      <div class="excel-stub">
        <div class="excel-stub-icon">📊</div>
        <div class="excel-stub-title">Coming Soon: Excel Technical Simulator</div>
        <div class="excel-stub-desc">
          Practice VLOOKUP, INDEX-MATCH, pivot tables, and conditional formatting
          in a simulated assessment environment. Timed exercises with scoring and feedback.
        </div>
        <div class="excel-stub-badge">Planned — Next Sprint</div>
      </div>`;
    this.ready = true;
  }
};

ExcelDojo.init();
