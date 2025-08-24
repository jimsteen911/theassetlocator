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
