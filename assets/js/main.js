// Mobile nav toggle + year + intake helpers
(function(){
  var btn=document.getElementById('burgerBtn');
  var menu=document.getElementById('site-menu');
  if(btn&&menu){
    btn.addEventListener('click',function(){
      var open=menu.classList.toggle('active');
      btn.setAttribute('aria-expanded',open?'true':'false');
    });
  }
  var y=document.getElementById('year'); if(y){ y.textContent=new Date().getFullYear(); }

  // Intake success message via ?thanks=1
  var params=new URLSearchParams(location.search);
  if(params.get('thanks')==='1'){
    var t=document.getElementById('thanks'); if(t){ t.style.display='block'; }
  }

  // Auto-fill date field on intake
  var sd=document.getElementById('sigdate');
  if(sd && !sd.value){
    sd.value=new Date().toISOString().slice(0,10);
  }

  // Basic client-side validation support
  var form=document.getElementById('intakeForm');
  if(form){
    form.addEventListener('submit', function(e){
      if(!form.checkValidity()){
        e.preventDefault();
        form.querySelectorAll(':invalid').forEach(function(el){
          el.setAttribute('aria-invalid','true');
        });
      }
    }, false);
  }
}());
