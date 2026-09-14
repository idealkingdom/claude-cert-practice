(()=>{
'use strict';
const previous=window.CLAUDE_CERT.buildBank;
const target=new Set(['architectP','developerF']);
window.CLAUDE_CERT.buildBank=key=>{
  const bank=previous(key);
  if(!target.has(key))return bank;
  const archive=bank.filter(q=>q.retired);
  const active=bank.filter(q=>!q.retired);
  if(!archive.length)return active;
  // app.js builds its historical ID lookup with the first .map() call, then uses
  // the array itself for new draws. Feed archived questions to that one lookup
  // so old saved attempts remain reviewable without allowing clones into new runs.
  const nativeMap=Array.prototype.map;
  let lookupPending=true;
  Object.defineProperty(active,'map',{
    configurable:true,writable:true,
    value:function(callback,thisArg){
      if(lookupPending){
        lookupPending=false;
        Object.defineProperty(active,'map',{configurable:true,writable:true,value:nativeMap});
        return nativeMap.call(active.concat(archive),callback,thisArg);
      }
      return nativeMap.call(active,callback,thisArg);
    }
  });
  return active;
};
})();
