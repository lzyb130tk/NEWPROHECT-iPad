/* The iPad edition keeps one current workspace in IndexedDB. */
(function(root){
  'use strict';
  const DB_NAME='newprohect-ipad';
  const STORE='workspace';
  function open(){
    return new Promise((resolve,reject)=>{
      if(!root.indexedDB)return reject(Error('此浏览器不支持本地存储'));
      const request=root.indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||Error('无法打开本地存储'));
      request.onblocked=()=>reject(Error('请关闭其他工作台页面后重试'));
    });
  }
  async function transaction(mode,action){
    const db=await open();
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
  root.LocalWorkspace={
    load:()=>transaction('readonly',store=>store.get('current')),
    save:value=>transaction('readwrite',store=>store.put(value,'current'))
  };
})(globalThis);
