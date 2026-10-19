/* Pure document and annotation operations; offsets follow Python Unicode code points. */
(function(root){
  'use strict';
  const LABELS=['DPR','RBL','AQT','OSR','VVR','ABD'];
  const cp=s=>Array.from(String(s??''));
  const compact=s=>String(s??'').toLocaleLowerCase().replace(/\\[nrt]/g,'').replace(/\s+/gu,'');
  const kind=a=>a.desc_type==='DPR'?'DPR':a.desc_type==='CPR'&&LABELS.includes(a.cpr_pattern)?a.cpr_pattern:null;
  function hasCompletePairedSuffix(ends){
    const opening=new Set(['（','(','“','‘','「','『']);
    const closing={ '）':'（',')':'(','”':'“','’':'‘','」':'「','』':'『' },stack=[];
    if(!Object.hasOwn(closing,ends.at(-1)))return false;
    let suffixStart=-1;
    for(let i=0;i<ends.length;i++){
      const char=ends[i];
      if(opening.has(char))stack.push({char,index:i});
      else if(Object.hasOwn(closing,char)){
        const start=stack.pop();
        if(!start||start.char!==closing[char])return false;
        if(i===ends.length-1)suffixStart=start.index;
      }
    }
    return stack.length===0&&suffixStart>0&&suffixStart<ends.length-2;
  }
  function annotationIssues(doc,a){
    const chars=cp(doc.content),issues=[];
    if(!Number.isInteger(a.start)||!Number.isInteger(a.end)||a.start<0||a.end>chars.length||a.end<=a.start)issues.push('位置超出正文范围');
    else if(a.text!==chars.slice(a.start,a.end).join(''))issues.push('文字与正文位置不一致');
    if(a.desc_type==='CPR'&&!LABELS.slice(1).includes(a.cpr_pattern))issues.push('CPR 子类无效');
    return issues;
  }
  function annotationWarnings(doc){
    const chars=cp(doc.content),annotations=doc.annotations;
    const warnings=annotations.map(a=>{
      const valid=Number.isInteger(a.start)&&Number.isInteger(a.end)&&a.start>=0&&a.start<a.end&&a.end<=chars.length;
      const value=valid?chars.slice(a.start,a.end).join(''):String(a.text??'');
      const ends=cp(value),boundary=[];
      if(ends.length&&/[\s\p{P}\p{S}]/u.test(ends[0]))boundary.push('开头');
      if(ends.length&&/[\s\p{P}\p{S}]/u.test(ends.at(-1))&&!hasCompletePairedSuffix(ends))boundary.push('结尾');
      return {overlap:false,boundary};
    });
    const ranges=annotations.map((a,index)=>({start:a.start,end:a.end,index}))
      .filter(a=>Number.isInteger(a.start)&&Number.isInteger(a.end)&&a.start>=0&&a.start<a.end&&a.end<=chars.length)
      .sort((a,b)=>a.start-b.start||b.end-a.end);
    let furthest=null;
    for(const range of ranges){
      if(furthest&&range.start<furthest.end){warnings[range.index].overlap=true;warnings[furthest.index].overlap=true;}
      if(!furthest||range.end>furthest.end)furthest=range;
    }
    return warnings;
  }
  function parseCity(value){
    if(!Array.isArray(value))throw Error('城市 JSON 顶层应为文档数组。');
    const ids=new Set();
    value.forEach((doc,i)=>{
      if(!doc||typeof doc!=='object'||Array.isArray(doc)||typeof doc.content!=='string')throw Error(`第 ${i+1} 篇缺少正文 content。`);
      if(doc.id===undefined||doc.id===null)throw Error(`第 ${i+1} 篇缺少 id。`);
      if(ids.has(String(doc.id)))throw Error(`文档 id 重复：${doc.id}`);
      ids.add(String(doc.id));
      if(doc.annotations===undefined)doc.annotations=[];
      if(!Array.isArray(doc.annotations))throw Error(`文档 ${doc.id} 的 annotations 应为数组。`);
      if(doc.annotations.some(a=>!a||typeof a!=='object'||Array.isArray(a)))throw Error(`文档 ${doc.id} 含有格式不正确的标注。`);
    });
    return value;
  }
  function setKind(a,label){
    if(!LABELS.includes(label))throw Error('未知类别');
    a.desc_type=label==='DPR'?'DPR':'CPR';
    a.cpr_pattern=label==='DPR'?null:label;
    if(Object.hasOwn(a,'main_label'))a.main_label=a.desc_type;
    return a;
  }
  function setRange(doc,a,start,end){
    const chars=cp(doc.content);
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>chars.length||start>=end)throw Error('标注范围无效。');
    a.start=start;a.end=end;a.text=chars.slice(start,end).join('');
    return a;
  }
  function searchDoc(doc,query,scope){
    const q=compact(query);if(!q)return true;
    if(scope==='full')return compact(`${doc.title??''} ${doc.id} ${doc.content}`).includes(q);
    return doc.annotations.some(a=>{
      if(!kind(a))return false;
      const value=compact(a.text);
      if(scope==='start')return value.startsWith(q);
      if(scope==='end')return value.endsWith(q);
      if(scope==='exact')return value===q;
      return value.includes(q);
    });
  }
  function searchFavorite(doc,a,query,scope){
    if(a.favorite!==true||!kind(a))return false;
    const q=compact(query);if(!q)return true;
    const value=compact(a.text);
    if(scope==='full')return compact(`${a.text??''} ${doc.title??''} ${doc.id}`).includes(q);
    if(scope==='start')return value.startsWith(q);
    if(scope==='end')return value.endsWith(q);
    if(scope==='exact')return value===q;
    return value.includes(q);
  }
  function counts(docs){
    const result=Object.fromEntries(LABELS.map(label=>[label,0]));
    for(const doc of docs)for(const a of doc.annotations){const label=kind(a);if(label)result[label]++;}
    return result;
  }
  function reviewProgress(docs,reviewed){
    const done=docs.filter((_,i)=>reviewed[i]===true).length;
    const skipped=docs.filter((doc,i)=>reviewed[i]!==true&&doc.review_skipped===true).length;
    return {total:docs.length,done,skipped,pending:docs.length-done-skipped};
  }
  const exportDocs=docs=>docs.filter(doc=>doc.review_skipped!==true);
  const isPending=(doc,done)=>done!==true&&doc.review_skipped!==true;
  const exportReviewed=(docs,reviewed)=>docs.filter((_,i)=>reviewed[i]===true);
  const isDprOnly=doc=>doc.annotations.length>0&&doc.annotations.every(a=>kind(a)==='DPR');
  const exportReviewedWithoutDprOnly=(docs,reviewed)=>exportReviewed(docs,reviewed).filter(doc=>!isDprOnly(doc));
  function matchingAnnotationIndices(doc,filterKind,query,scope,favoritesOnly=false){
    if(filterKind==='DPR-only'&&!isDprOnly(doc))return [];
    const q=compact(query);
    return doc.annotations.flatMap((a,i)=>{
      if(favoritesOnly&&a.favorite!==true)return [];
      const label=kind(a);
      if(filterKind==='DPR-only'?label!=='DPR':label!==filterKind)return [];
      const value=compact(a.text);
      const matches=!q||(
        scope==='start'?value.startsWith(q):
        scope==='end'?value.endsWith(q):
        scope==='exact'?value===q:value.includes(q)
      );
      return matches?[i]:[];
    });
  }
  function resumePendingIndex(docs,reviewed,lastPendingDocId,activeDocId){
    const byId=id=>docs.findIndex((doc,i)=>String(doc.id)===String(id)&&isPending(doc,reviewed[i]));
    if(lastPendingDocId!==null&&lastPendingDocId!==undefined){const i=byId(lastPendingDocId);if(i>=0)return i;}
    if(activeDocId!==null&&activeDocId!==undefined){const i=byId(activeDocId);if(i>=0)return i;}
    const anchor=docs.findIndex(doc=>String(doc.id)===String(activeDocId));
    const pending=docs.map((doc,i)=>isPending(doc,reviewed[i])?i:-1).filter(i=>i>=0);
    if(pending.length)return anchor<0?pending[0]:pending.reduce((best,i)=>Math.abs(i-anchor)<=Math.abs(best-anchor)?i:best);
    return anchor>=0?anchor:(docs.length?0:-1);
  }
  function exportAll(docs,reviewed,activeDocId,lastPendingDocId,name){
    return {format:'newprohect-workspace-v1',name,activeDocId,lastPendingDocId,reviewed:[...reviewed],docs,exportedAt:new Date().toISOString()};
  }
  function parseImport(value,filename){
    if(Array.isArray(value)){
      const docs=parseCity(value);
      return {docs,reviewed:docs.map(()=>false),activeDocId:docs[0]?.id??null,lastPendingDocId:docs[0]?.id??null,name:filename,isWorkspace:false};
    }
    if(!value||typeof value!=='object')throw Error('JSON 格式无效，应为城市文档数组或工作区备份。');
    const envelope=value.workspace&&typeof value.workspace==='object'&&!Array.isArray(value.workspace)?value.workspace:value;
    const state=envelope.session&&typeof envelope.session==='object'&&!Array.isArray(envelope.session)?envelope.session:envelope;
    const sourceDocs=Array.isArray(envelope.docs)?envelope.docs:Array.isArray(envelope.documents)?envelope.documents:Array.isArray(envelope.data)?envelope.data:null;
    if(!sourceDocs)throw Error('未找到文档数组；旧版备份应包含 docs、documents 或 data。');
    const docs=parseCity(sourceDocs),hasState=Array.isArray(state.reviewed),reviewed=hasState?state.reviewed:docs.map(()=>false);
    if(hasState&&(reviewed.length!==docs.length||reviewed.some(done=>typeof done!=='boolean')))throw Error('工作区标注状态无效。');
    const validId=id=>id===null||id===undefined||docs.some(doc=>String(doc.id)===String(id));
    if(!validId(state.activeDocId)||!validId(state.lastPendingDocId))throw Error('工作区文档位置无效。');
    const index=resumePendingIndex(docs,reviewed,state.lastPendingDocId,state.activeDocId);
    return {docs,reviewed,activeDocId:docs[index]?.id??null,lastPendingDocId:state.lastPendingDocId??null,name:typeof state.name==='string'&&state.name?state.name:filename,isWorkspace:hasState||!!value.format||envelope!==value};
  }
  function exportOverlaps(docs){
    const conflicts=[];
    docs.forEach((doc,docIndex)=>{
      if(doc.review_skipped===true)return;
      const length=cp(doc.content).length;
      const ranges=doc.annotations.map((a,annotationIndex)=>({start:a.start,end:a.end,annotationIndex}))
        .filter(a=>Number.isInteger(a.start)&&Number.isInteger(a.end)&&a.start>=0&&a.start<a.end&&a.end<=length)
        .sort((a,b)=>a.start-b.start||b.end-a.end);
      let furthest=null;
      for(const range of ranges){
        if(furthest&&range.start<furthest.end)conflicts.push({docIndex,annotationIndex:range.annotationIndex,withIndex:furthest.annotationIndex});
        if(!furthest||range.end>furthest.end)furthest=range;
      }
    });
    return conflicts;
  }
  const api={LABELS,cp,compact,kind,annotationIssues,annotationWarnings,parseCity,parseImport,setKind,setRange,searchDoc,searchFavorite,counts,reviewProgress,isPending,exportDocs,exportReviewed,isDprOnly,exportReviewedWithoutDprOnly,matchingAnnotationIndices,exportAll,resumePendingIndex,exportOverlaps};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.AnnotationModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
