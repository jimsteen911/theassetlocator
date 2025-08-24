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
