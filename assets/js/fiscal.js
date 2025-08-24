<!-- usage example in your HTML -->
<!-- <script src="assets/js/fiscal.js" defer></script> -->
<!-- <div id="fxTable"></div> -->
<!-- <script>
  document.addEventListener('DOMContentLoaded', async () => {
    // Example: last 30 days USD→CAD exchange rates
    const toISO = (d)=>d.toISOString().slice(0,10);
    const today = new Date();
    const from = new Date(); from.setDate(today.getDate()-30);

    const data = await FiscalAPI.ratesOfExchange({
      country:'Canada',
      from: toISO(from),
      to:   toISO(today),
      fields:['record_date','country','currency','exchange_rate']
    });

    FiscalAPI.renderTable(document.getElementById('fxTable'), data, {
      columns: [
        {key:'record_date', label:'Date'},
        {key:'currency',    label:'Currency'},
        {key:'exchange_rate', label:'USD per unit'}
      ]
    });
  });
</script> -->
// assets/js/fiscal.js
// Minimal client for Treasury Fiscal Data API
const FiscalAPI = (() => {
  const BASE = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1';

  // Build query string safely
  function qs(params = {}) {
    const parts = [];
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
    return parts.length ? `?${parts.join('&')}` : '';
  }

  // Generic fetch (handles simple pagination)
  async function fetchAll(endpoint, { params = {}, maxPages = 3 } = {}) {
    let page = 1, out = [];
    while (page <= maxPages) {
      const url = `${endpoint}${qs({...params, 'page[number]': page, 'page[size]': params['page[size]'] || 1000})}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const json = await res.json();
      const rows = json?.data || json?.[Object.keys(json)[0]] || [];
      out = out.concat(rows);
      const last = json?.links?.last;
      if (!last || (json?.links?.next ?? null) === null) break;
      page++;
    }
    return out;
  }

  // Helpers to build API params
  function buildParams({ fields, filter, sort, format='json' } = {}) {
    return {
      format,
      ...(fields?.length ? { fields: fields.join(',') } : {}),
      ...(filter ? { filter } : {}),
      ...(sort ? { sort } : {})
    };
  }

  // Dataset: Rates of Exchange (accounting/od/rates_of_exchange)
  // filters use the API syntax: field:op:value (op = eq, gte, lte, etc.), combine with commas
  async function ratesOfExchange({ country, from, to, fields = ['record_date','country','currency','exchange_rate'] } = {}) {
    const endpoint = `${BASE}/accounting/od/rates_of_exchange`;
    const parts = [];
    if (country) parts.push(`country:eq:${country}`);
    if (from)    parts.push(`record_date:gte:${from}`);
    if (to)      parts.push(`record_date:lte:${to}`);
    const filter = parts.join(',');
    const params = buildParams({ fields, filter, sort: '-record_date' });
    return fetchAll(endpoint, { params });
  }

  // Dataset: Debt to the Penny (accounting/od/…)
  async function debtToPenny({ from, to, fields = ['record_date','debt_outstanding_amt','debt_held_public_amt','intragov_hold_amt'] } = {}) {
    const endpoint = `${BASE}/accounting/od/debt_to_penny`;
    const parts = [];
    if (from) parts.push(`record_date:gte:${from}`);
    if (to)   parts.push(`record_date:lte:${to}`);
    const filter = parts.join(',');
    const params = buildParams({ fields, filter, sort: '-record_date' });
    return fetchAll(endpoint, { params });
  }

  // Simple table renderer
  function renderTable(el, rows, { columns } = {}) {
    if (!el) return;
    if (!rows?.length) { el.innerHTML = '<div class="card">No data.</div>'; return; }
    const cols = columns || Object.keys(rows[0]).map(k => ({ key:k, label:k }));
    const thead = `<thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${escapeHTML(r[c.key] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
    el.innerHTML = `<div class="card" style="overflow:auto"><table>${thead}${tbody}</table></div>`;
    // Minimal styles
    const style = document.createElement('style');
    style.textContent = `table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #202636;padding:8px;text-align:left}
      th{background:#171B25;color:#EDEDED;position:sticky;top:0}`;
    document.head.appendChild(style);
  }

  function escapeHTML(x){
    return String(x).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
  }

  return { ratesOfExchange, debtToPenny, renderTable };
})();
/* =========================================================
   The Asset Locator – Treasury Fiscal Data API utilities
   Lightweight, no dependencies, works on GitHub Pages
   ========================================================= */

const FiscalAPI = (() => {
  const BASE = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1';

  // Build query string
  function qs(params = {}) {
    const parts = [];
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
    return parts.length ? `?${parts.join('&')}` : '';
  }

  // Generic fetch with simple pagination
  async function fetchAll(endpoint, { params = {}, maxPages = 3 } = {}) {
    let page = 1, out = [];
    while (page <= maxPages) {
      const url = `${endpoint}${qs({
        ...params,
        'page[number]': page,
        'page[size]': params['page[size]'] || 1000
      })}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const json = await res.json();
      const rows = json?.data || json?.[Object.keys(json)[0]] || [];
      out = out.concat(rows);
      const next = json?.links?.next ?? null;
      if (!next) break;
      page++;
    }
    return out;
  }

  // Param helpers
  function buildParams({ fields, filter, sort, format='json' } = {}) {
    return {
      format,
      ...(fields?.length ? { fields: fields.join(',') } : {}),
      ...(filter ? { filter } : {}),
      ...(sort ? { sort } : {})
    };
  }

  // --- Datasets ---

  // Rates of Exchange
  // docs: /accounting/od/rates_of_exchange
  async function ratesOfExchange({ country, from, to, fields = ['record_date','country','currency','exchange_rate'] } = {}) {
    const endpoint = `${BASE}/accounting/od/rates_of_exchange`;
    const parts = [];
    if (country) parts.push(`country:eq:${country}`);
    if (from)    parts.push(`record_date:gte:${from}`);
    if (to)      parts.push(`record_date:lte:${to}`);
    const filter = parts.join(',');
    const params = buildParams({ fields, filter, sort: '-record_date' });
    return fetchAll(endpoint, { params });
  }

  // Debt to the Penny
  // docs: /accounting/od/debt_to_penny
  async function debtToPenny({ from, to, fields = ['record_date','debt_outstanding_amt','debt_held_public_amt','intragov_hold_amt'] } = {}) {
    const endpoint = `${BASE}/accounting/od/debt_to_penny`;
    const parts = [];
    if (from) parts.push(`record_date:gte:${from}`);
    if (to)   parts.push(`record_date:lte:${to}`);
    const filter = parts.join(',');
    const params = buildParams({ fields, filter, sort: '-record_date' });
    return fetchAll(endpoint, { params });
  }

  // --- Rendering helpers ---

  function escapeHTML(x){
    return String(x).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
  }

  function renderTable(el, rows, { columns } = {}) {
    if (!el) return;
    if (!rows?.length) { el.innerHTML = '<div class="card">No data.</div>'; return; }
    const cols = columns || Object.keys(rows[0]).map(k => ({ key:k, label:k }));
    const thead = `<thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${escapeHTML(r[c.key] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
    el.innerHTML = `<div class="card" style="overflow:auto"><table class="fiscal-table">${thead}${tbody}</table></div>`;

    // Minimal table styling (isolated)
    if (!document.getElementById('fiscal-table-style')) {
      const style = document.createElement('style');
      style.id = 'fiscal-table-style';
      style.textContent = `
        .fiscal-table{border-collapse:collapse;width:100%}
        .fiscal-table th,.fiscal-table td{border:1px solid #202636;padding:8px;text-align:left}
        .fiscal-table th{background:#171B25;color:#EDEDED;position:sticky;top:0}
      `;
      document.head.appendChild(style);
    }
  }

  // --- Homepage widget wiring (tabs) ---
  // Call FiscalAPI.mountHomepageWidget('#treasury-widget') from your HTML.
  async function mountHomepageWidget(rootSelector){
    const root = document.querySelector(rootSelector);
    if (!root) return;

    // Build skeleton
    root.innerHTML = `
      <div class="cards" style="grid-template-columns:1fr">
        <div class="card">
          <div class="tabbar" role="tablist" aria-label="Treasury data">
            <button class="tab active" role="tab" aria-selected="true" data-tab="fx">Exchange Rates</button>
            <button class="tab" role="tab" aria-selected="false" data-tab="debt">Debt to the Penny</button>
          </div>
          <div class="tabpanel" id="panel-fx" role="tabpanel"></div>
          <div class="tabpanel" id="panel-debt" role="tabpanel" hidden></div>
        </div>
      </div>
    `;

    // Tab behavior
    const tabs = root.querySelectorAll('.tabbar .tab');
    tabs.forEach(t => t.addEventListener('click', (e)=>{
      tabs.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
      e.currentTarget.classList.add('active');
      e.currentTarget.setAttribute('aria-selected','true');
      const show = e.currentTarget.dataset.tab;
      root.querySelector('#panel-fx').hidden   = (show !== 'fx');
      root.querySelector('#panel-debt').hidden = (show !== 'debt');
    }));

    // Load default data
    try {
      // FX: last 30 days, Canada example (you can change country)
      const toISO = d=>d.toISOString().slice(0,10);
      const today = new Date();
      const from  = new Date(); from.setDate(today.getDate()-30);

      const fxRows = await ratesOfExchange({
        country: 'Canada',
        from: toISO(from),
        to:   toISO(today),
        fields: ['record_date','country','currency','exchange_rate']
      });
      renderTable(root.querySelector('#panel-fx'), fxRows, {
        columns: [
          { key:'record_date', label:'Date' },
          { key:'currency',    label:'Currency' },
          { key:'exchange_rate', label:'USD per unit' }
        ]
      });

      // Debt: last 180 days summary
      const fromDebt = new Date(); fromDebt.setDate(today.getDate()-180);
      const debtRows = await debtToPenny({
        from: toISO(fromDebt),
        to:   toISO(today),
        fields: ['record_date','debt_outstanding_amt','debt_held_public_amt','intragov_hold_amt']
      });
      renderTable(root.querySelector('#panel-debt'), debtRows, {
        columns: [
          { key:'record_date', label:'Date' },
          { key:'debt_outstanding_amt', label:'Total Outstanding ($)' },
          { key:'debt_held_public_amt', label:'Held by Public ($)' },
          { key:'intragov_hold_amt', label:'Intragovernmental ($)' }
        ]
      });
    } catch (err) {
      root.querySelector('#panel-fx').innerHTML   = `<div class="card">Error loading data: ${escapeHTML(err.message)}</div>`;
      root.querySelector('#panel-debt').innerHTML = `<div class="card">Error loading data: ${escapeHTML(err.message)}</div>`;
    }

    // Minimal styles for tabs (isolated)
    if (!document.getElementById('fiscal-tab-style')) {
      const style = document.createElement('style');
      style.id = 'fiscal-tab-style';
      style.textContent = `
        .tabbar{display:flex;gap:8px;margin:-6px 0 12px 0;flex-wrap:wrap}
        .tab{
          background:#171B25;color:#EDEDED;border:1px solid #202636;border-bottom:2px solid transparent;
          padding:8px 12px;border-radius:8px;cursor:pointer
        }
        .tab.active{border-bottom-color:#C9A227}
        .tabpanel{min-height:120px}
      `;
      document.head.appendChild(style);
    }
  }

  return { ratesOfExchange, debtToPenny, renderTable, mountHomepageWidget };
})();

/* Auto-mount if a placeholder exists on the page */
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#treasury-widget')) {
    FiscalAPI.mountHomepageWidget('#treasury-widget');
  }
});
