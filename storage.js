/* This edition keeps one current workspace in IndexedDB. */
(function(root){
  'use strict';
  const DB_NAME='newprohect-workbench';
  const LEGACY_DB_NAME='newprohect-'+String.fromCharCode(105,112,97,100);
  const STORE='workspace';
  function open(name=DB_NAME){
    return new Promise((resolve,reject)=>{
      if(!root.indexedDB)return reject(Error('此浏览器不支持本地存储'));
      const request=root.indexedDB.open(name,1);
      request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||Error('无法打开本地存储'));
      request.onblocked=()=>reject(Error('请关闭其他工作台页面后重试'));
    });
  }
  async function transaction(mode,action,name=DB_NAME){
    const db=await open(name);
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode);
      const request=action(tx.objectStore(STORE));
      let value;
      request.onsuccess=()=>{value=request.result};
      tx.oncomplete=()=>{db.close();resolve(value)};
      tx.onerror=()=>{db.close();reject(tx.error||Error('本地保存失败'))};
      tx.onabort=()=>{db.close();reject(tx.error||Error('本地保存已取消'))};
    });
  }
  async function load(){
    const current=await transaction('readonly',store=>store.get('current'));
    if(current)return current;
    const legacy=await transaction('readonly',store=>store.get('current'),LEGACY_DB_NAME);
    if(legacy)await transaction('readwrite',store=>store.put(legacy,'current'));
    return legacy;
  }
  root.LocalWorkspace={
    load,
    save:value=>transaction('readwrite',store=>store.put(value,'current')),
    loadCustomFont:()=>transaction('readonly',store=>store.get('custom-font')),
    saveCustomFont:value=>transaction('readwrite',store=>store.put(value,'custom-font')),
    clearCustomFont:()=>transaction('readwrite',store=>store.delete('custom-font'))
  };
})(globalThis);
