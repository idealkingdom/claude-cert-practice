(()=>{
function inject(){
  document.querySelectorAll('.bottom-nav').forEach(nav=>{
    if(nav.querySelector('.academy-nav-link'))return;
    nav.style.gridTemplateColumns='repeat(3,1fr)';
    const a=document.createElement('a');
    a.href='learn.html';
    a.className='nav-btn academy-nav-link';
    a.style.textDecoration='none';
    a.innerHTML='<span class="nav-icon">◫</span><span>Learn</span>';
    nav.appendChild(a);
  });
}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
inject();
})();
