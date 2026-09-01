(()=>{
function inject(){
  if(document.querySelector('.ccarf-float'))return;
  const box=document.createElement('aside');
  box.className='ccarf-float';
  box.innerHTML='<strong>CCAR-F FIRST EXAM</strong><a href="ccarf-labs.html">Labs</a><a href="ccarf-final.html">Sealed Final Gate</a>';
  document.body.appendChild(box);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
})();