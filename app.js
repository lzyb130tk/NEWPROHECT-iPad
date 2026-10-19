(function(){
  'use strict';
  const M=window.AnnotationModel,S=window.LocalWorkspace,$=id=>document.getElementById(id);
  const names={DPR:'直接地点',RBL:'相对位置',AQT:'锚点限定目标',OSR:'对象 / 场景',VVR:'视点 / 视觉关系',ABD:'语义类比'};
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(location.protocol==='file:'){
    $('welcome').innerHTML='<div class="welcome-icon">⌁</div><h1>请从网页地址打开工作台</h1><p>iPad 离线版需要先从 GitHub Pages 等 HTTPS 地址打开，不能直接打开 index.html 文件。</p>';
    $('save-status').textContent='请打开网页地址';
    $('import').disabled=true;
    $('export').disabled=true;
    return;
  }
  let docs=[],fileName='',active=-1,filterKind='all',favoritesOnly=false,selected=-1,pending=null,dragging=null,dirty=false,toastTimer=null,selectionDraft=null,selectionActionPress=false;
  let sessionId=null,reviewed=[],lastPendingDocId=null,changeVersion=0,savedVersion=0,savePromise=null,saveFailed=false,exportOverlapAcknowledged=false;
  let theme=false,visualStyle='notion',reverseWheel=true;
  try{theme=localStorage.getItem('newprohect-theme')==='dark';visualStyle=localStorage.getItem('newprohect-style')==='macos'?'macos':'notion';reverseWheel=localStorage.getItem('newprohect-wheel-reverse')!=='false'}catch{}
  function applyAppearance(){
    const root=document.documentElement;root.dataset.style=visualStyle;root.classList.toggle('dark',theme);
    document.querySelector('meta[name="theme-color"]').content=visualStyle==='notion'?(theme?'#20201E':'#F7F6F2'):(theme?'#1C1C1E':'#F5F5F7');
    for(const style of ['notion','macos'])$('style-'+style).setAttribute('aria-pressed',String(visualStyle===style));
    $('theme').innerHTML=theme?'☀ <span>浅色</span>':'☾ <span>深色</span>';
    $('theme').setAttribute('aria-label',theme?'切换浅色模式':'切换深色模式');
  }
  function applyWheelPreference(){const button=$('wheel-toggle');button.textContent=reverseWheel?'滚轮：反向':'滚轮：标准';button.setAttribute('aria-pressed',String(reverseWheel));button.title=reverseWheel?'向后滚向下；点击切换方向':'向前滚向下；点击切换方向'}
  applyAppearance();applyWheelPreference();
  document.addEventListener('wheel',event=>{
    if(event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
    const scroller=event.target instanceof Element?event.target.closest('#documents,.reading-panel,.annotations-panel'):null;
    if(!scroller||!event.deltaY)return;
    const unit=event.deltaMode===1?32:event.deltaMode===2?scroller.clientHeight:1;
    const distance=Math.sign(event.deltaY)*Math.max(64,Math.abs(event.deltaY*unit)*2.4);
    event.preventDefault();scroller.scrollTop+=(reverseWheel?-1:1)*distance;
  },{passive:false});
  function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200)}
  function current(){return docs[active]}
  function newId(){return 'review_'+(crypto.randomUUID?.()||`${Date.now()}_${Math.random().toString(36).slice(2)}`)}
  function saveStatus(message,failed=false){$('save-status').textContent=message;$('save-status').classList.toggle('failed',failed)}
  function workspace(){return {session:{id:sessionId,name:fileName,reviewed:[...reviewed],activeDocId:current()?.id??null,lastPendingDocId},docs:structuredClone(docs)}}
  function persist(){
    if(!sessionId)return;
    if(current()&&M.isPending(current(),reviewed[active]))lastPendingDocId=current().id;
    changeVersion++;dirty=true;saveFailed=false;saveStatus('保存中…');
    if(savePromise)return;
    savePromise=(async()=>{
      while(savedVersion<changeVersion){
        const version=changeVersion;
        const payload=workspace();
        try{
          await S.save(payload);
          savedVersion=version;dirty=savedVersion<changeVersion;
          if(!dirty)saveStatus('已自动保存');
        }catch(error){saveFailed=true;saveStatus('保存失败 · 点击重试',true);toast(error.message);break}
      }
    })().finally(()=>{savePromise=null});
  }
  function resetExportWarning(){exportOverlapAcknowledged=false;$('export').textContent='导出 JSON'}
  function markChanged(){resetExportWarning();renderCounts();if(favoritesOnly)applyFilter(false);else renderDocuments();persist()}
  function validRanges(doc){return doc.annotations.map((a,index)=>({a,index})).filter(({a})=>M.kind(a)&&!M.annotationIssues(doc,a).some(issue=>issue.includes('位置'))).sort((x,y)=>x.a.start-y.a.start||y.a.end-x.a.end)}
  function favoriteResults(){const q=$('query').value,scope=$('scope').value,items=[];docs.forEach((doc,docIndex)=>doc.annotations.forEach((a,annIndex)=>{if((filterKind==='all'||M.kind(a)===filterKind)&&M.searchFavorite(doc,a,q,scope))items.push({docIndex,annIndex,a})}));return items}
  function visibleIndices(){if(favoritesOnly)return [...new Set(favoriteResults().map(item=>item.docIndex))];const q=$('query').value,scope=$('scope').value;return docs.map((doc,i)=>({doc,i})).filter(({doc})=>M.searchDoc(doc,q,scope)&&(filterKind==='all'||doc.annotations.some(a=>M.kind(a)===filterKind))).map(({i})=>i)}
  function renderCounts(){const counts=favoritesOnly?M.counts(docs.map(doc=>({...doc,annotations:doc.annotations.filter(a=>a.favorite===true)}))):M.counts(docs);$('count-all').textContent=favoritesOnly?docs.reduce((total,doc)=>total+doc.annotations.filter(a=>a.favorite===true&&M.kind(a)).length,0):docs.length;for(const label of M.LABELS)$(`count-${label}`).textContent=counts[label];const annotated=docs.filter(doc=>doc.annotations.some(a=>M.kind(a))).length,{total,done,skipped,pending}=M.reviewProgress(docs,reviewed);$('progress-text').textContent=`全部 ${total} · 已标注 ${annotated} · 待标注 ${pending} · 标注完 ${done} · 不标记 ${skipped}`;$('progress-fill').style.width=total?`${(done+skipped)/total*100}%`:'0%'}
  function renderDocuments(){
    if(favoritesOnly){
      const items=favoriteResults();
      $('side-title').textContent='收藏标注';$('doccount').textContent=`${items.length} 条`;
      $('documents').innerHTML=items.map(({docIndex,annIndex,a})=>{const doc=docs[docIndex];return `<button class="doc-item favorite-item ${active===docIndex&&selected===annIndex?'active':''}" type="button" data-favorite-doc="${docIndex}" data-favorite-ann="${annIndex}"><span class="ordinal">★ ${escape(M.kind(a))} · #${docIndex+1}</span><strong>${escape(a.text??'（无文字）')}</strong><span class="preview">${escape(doc.title||`文档 ${doc.id}`)} · ID ${escape(doc.id)}</span></button>`}).join('')||'<p class="hint" style="padding:8px 12px">没有符合条件的收藏标注。</p>';
      document.querySelectorAll('[data-favorite-doc]').forEach(button=>button.onclick=()=>openFavorite(Number(button.dataset.favoriteDoc),Number(button.dataset.favoriteAnn)));
      return;
    }
    const indices=visibleIndices();$('side-title').textContent='文档';$('doccount').textContent=`${indices.length} / ${docs.length} 篇`;
    $('documents').innerHTML=indices.map(i=>{const doc=docs[i],title=doc.title||`文档 ${doc.id}`,status=reviewed[i]?'done':doc.review_skipped===true?'skipped':'pending',statusText=status==='done'?'标注完':status==='skipped'?'不标记':'待标注';return `<div class="doc-entry"><button class="doc-item ${active===i?'active':''}" type="button" data-doc="${i}"><span class="ordinal">#${i+1} · ID ${escape(doc.id)}</span><strong>${escape(title)}</strong><span class="preview">${escape(doc.content.replace(/\s+/gu,' ').slice(0,100))}</span><span class="doc-count">${doc.annotations.filter(a=>M.kind(a)).length} 条标注</span></button><button class="review-label ${status}" type="button" data-review="${i}" aria-label="${status==='pending'?'标记为标注完':'恢复待标注'}">${statusText}</button></div>`}).join('')||'<p class="hint" style="padding:8px 12px">没有符合条件的文档。</p>';
    document.querySelectorAll('[data-doc]').forEach(button=>button.onclick=()=>openDoc(Number(button.dataset.doc)));document.querySelectorAll('[data-review]').forEach(button=>button.onclick=()=>{const i=Number(button.dataset.review);if(docs[i]?.review_skipped===true&&!reviewed[i])toggleSkip(i);else toggleReview(i)});
  }
  function toggleReview(i){if(!docs[i])return;reviewed[i]=!reviewed[i];delete docs[i].review_skipped;resetExportWarning();renderCounts();renderDocuments();if(i===active)renderReviewButton();persist()}
  function toggleSkip(i){if(!docs[i])return;if(docs[i].review_skipped===true)delete docs[i].review_skipped;else{docs[i].review_skipped=true;reviewed[i]=false}resetExportWarning();renderCounts();renderDocuments();if(i===active)renderReviewButton();persist()}
  function renderReviewButton(){const done=!!reviewed[active],skipped=current()?.review_skipped===true&&!done;$('review-toggle').textContent=done?'改为待标注':'标记为标注完';$('review-toggle').classList.toggle('reviewed',done);$('skip-toggle').textContent=skipped?'恢复待标注':'不标记此篇';$('skip-toggle').classList.toggle('skipped',skipped)}
  function revealActiveDocument(){if(favoritesOnly||active<0)return;requestAnimationFrame(()=>{const list=$('documents'),item=list.querySelector(`[data-doc="${active}"]`);if(!item)return;const listRect=list.getBoundingClientRect(),itemRect=item.getBoundingClientRect(),top=list.scrollTop+itemRect.top-listRect.top-(list.clientHeight-itemRect.height)/2;list.scrollTo({top:Math.max(0,top),behavior:'auto'})})}
  function openDoc(i){if(i<0||i>=docs.length)return;const changed=i!==active;clearSelectionToolbar();active=i;selected=favoritesOnly?(favoriteResults().find(item=>item.docIndex===i)?.annIndex??-1):-1;pending=null;hideMenu();renderDocuments();renderEditor();revealActiveDocument();if(changed)persist()}
  function openFavorite(docIndex,annIndex){openDoc(docIndex);locateAnnotation(annIndex);renderDocuments()}
  function renderEditor(){const doc=current();$('welcome').hidden=!!doc;$('editor').hidden=!doc;if(!doc)return;const indices=visibleIndices(),position=indices.indexOf(active);$('docmeta').textContent=`第 ${active+1} 篇 / 共 ${docs.length} 篇 · ID ${doc.id}`;$('prev').disabled=position<=0;$('next').disabled=position<0||position>=indices.length-1;$('span-count').textContent=`${doc.annotations.filter(a=>M.kind(a)).length} 条地点标注`;renderReviewButton();renderContext();renderAnnotations()}
  function renderContext(){const doc=current(),chars=M.cp(doc.content),ranges=validRanges(doc),segments=[],overlaps=[];let cursor=0;
    for(const {a,index} of ranges){if(a.start<cursor){overlaps.push(index);continue}if(a.start>cursor)segments.push(`<span class="segment" data-start="${cursor}">${escape(chars.slice(cursor,a.start).join(''))}</span>`);const label=M.kind(a),type=label==='DPR'?'dpr':'cpr';segments.push(`<span class="mark ${type} ${selected===index?'selected':''}" data-ann="${index}" title="${label} · 单击修改 / 菜单复制文字 / 长按删除"><i class="edge" data-edge="start" role="button" tabindex="0" aria-label="拖动标注起点"></i><span class="segment" data-start="${a.start}">${escape(chars.slice(a.start,a.end).join(''))}</span><i class="edge" data-edge="end" role="button" tabindex="0" aria-label="拖动标注终点"></i><sup class="badge">${label}</sup></span>`);cursor=a.end;}
    if(cursor<chars.length)segments.push(`<span class="segment" data-start="${cursor}">${escape(chars.slice(cursor).join(''))}</span>`);
    $('context').innerHTML=segments.join('')||'<span class="hint">正文为空</span>';
    $('context').dataset.overlaps=overlaps.join(',');
  }
  function textPoint(index){
    for(const segment of $('context').querySelectorAll('.segment[data-start]')){
      const node=segment.firstChild;if(node?.nodeType!==Node.TEXT_NODE)continue;
      const start=Number(segment.dataset.start),chars=M.cp(node.textContent);
      if(index>=start&&index<=start+chars.length)return {node,offset:chars.slice(0,index-start).join('').length};
    }
    return null;
  }
  function highlightRange(a){
    if(!Number.isInteger(a.start)||!Number.isInteger(a.end)||a.start>=a.end)return false;
    const start=textPoint(a.start),end=textPoint(a.end);if(!start||!end)return false;
    const range=document.createRange();range.setStart(start.node,start.offset);range.setEnd(end.node,end.offset);
    start.node.parentElement.scrollIntoView({behavior:'smooth',block:'center'});
    if(window.CSS?.highlights&&window.Highlight){
      const highlight=new Highlight(range);CSS.highlights.set('annotation-focus',highlight);
      setTimeout(()=>{if(CSS.highlights.get('annotation-focus')===highlight)CSS.highlights.delete('annotation-focus')},1800);
    }else{
      const selection=getSelection();selection?.removeAllRanges();selection?.addRange(range);
      setTimeout(()=>{if(selection?.rangeCount&&selection.getRangeAt(0)===range)selection.removeAllRanges()},1800);
    }
    return true;
  }
  function locateAnnotation(i){
    const a=current()?.annotations[i];if(!a)return;
    selected=i;renderContext();renderAnnotations();
    const mark=$('context').querySelector(`[data-ann="${i}"]`),row=$('annotations').querySelector(`[data-row="${i}"]`);
    if(mark)mark.scrollIntoView({behavior:'smooth',block:'center'});
    else if(!highlightRange(a))toast('这条标注的位置无效，请在右侧调整范围');
    row?.scrollIntoView({behavior:'smooth',block:'nearest'});
    for(const el of [mark,row])if(el){el.classList.add('favorite-flash');setTimeout(()=>el.classList.remove('favorite-flash'),1800)}
  }
  function renderAnnotations(){const doc=current();const bad=[];const rows=doc.annotations.map((a,i)=>{const label=M.kind(a),issues=M.annotationIssues(doc,a);if(issues.length)bad.push(`#${i+1} ${issues.join('、')}`);if(!label&&a.desc_type!=='CPR'&&a.desc_type!=='DPR')return '';return `<div class="annotation-row ${selected===i?'active':''}" data-row="${i}"><div class="annotation-row-top"><span class="pill ${label==='DPR'?'dpr':'cpr'}">${escape(label||'待修正')}</span><b>${escape(a.text??'（无文字）')}</b></div><small>字符 ${escape(a.start)}–${escape(a.end)}${issues.length?' · '+escape(issues.join('、')):''}</small><div class="row-actions"><button type="button" data-action="locate" data-i="${i}">定位</button><button type="button" data-action="kind" data-i="${i}">类别</button><button type="button" data-action="copy" data-i="${i}">复制</button><button type="button" data-action="favorite" data-i="${i}" class="${a.favorite===true?'is-favorite':''}" aria-pressed="${a.favorite===true}">${a.favorite===true?'★ 已收藏':'☆ 收藏'}</button><button type="button" data-action="delete" data-i="${i}" class="danger">删除</button></div><details class="range-details"><summary>精确调整范围</summary><div><label>起点 <input class="range-start" type="number" min="0" value="${escape(a.start)}"></label><label>终点 <input class="range-end" type="number" min="1" value="${escape(a.end)}"></label><button type="button" data-action="range" data-i="${i}">应用</button></div></details></div>`}).join('');$('annotations').innerHTML=rows||'<p class="hint">这篇文档还没有地点标注。请在正文中拖选文字。</p>';const overlapIndices=$('context').dataset.overlaps.split(',').filter(Boolean).map(Number);$('issues').innerHTML=[bad.length?`<div class="issue">${bad.length} 条标注需要检查：${escape(bad.slice(0,3).join('；'))}${bad.length>3?'…':''}</div>`:'',overlapIndices.length?`<div class="issue overlap-issue"><strong>${overlapIndices.length} 条标注与其他标注重叠</strong><p>点击下方条目定位并高亮；标注会保留在工作副本中；未跳过的文章导出时也会保留。</p><div class="issue-links">${overlapIndices.map(i=>`<button type="button" data-overlap="${i}">#${i+1} ${escape(doc.annotations[i]?.text??'（无文字）')}</button>`).join('')}</div></div>`:''].join('');document.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>rowAction(button.dataset.action,Number(button.dataset.i),button));document.querySelectorAll('[data-overlap]').forEach(button=>button.onclick=()=>locateAnnotation(Number(button.dataset.overlap)))}
  function rowAction(action,i,button){const doc=current(),a=doc.annotations[i];if(!a)return;if(action==='delete'){removeAnnotation(i);return}if(action==='copy'){copyAnnotation(i);return}if(action==='favorite'){if(a.favorite===true)delete a.favorite;else a.favorite=true;markChanged();renderAnnotations();toast(a.favorite===true?'已收藏标注':'已取消收藏');return}if(action==='range'){const row=button.closest('.annotation-row');try{M.setRange(doc,a,row.querySelector('.range-start').valueAsNumber,row.querySelector('.range-end').valueAsNumber);selected=i;markChanged();renderEditor();toast('范围和标注文字已更新')}catch(error){toast(error.message)}return}if(action==='locate'){locateAnnotation(i);return}selected=i;renderContext();renderAnnotations();showMenu(button.getBoundingClientRect().left,button.getBoundingClientRect().bottom+4,{type:'edit',index:i})}
  function removeAnnotation(i){const doc=current();if(!doc?.annotations[i])return;doc.annotations.splice(i,1);selected=-1;markChanged();renderEditor();toast('标注已删除。可重新导入上一次导出的文件恢复。')}
  async function copyText(value){try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(String(value));else{const input=document.createElement('textarea');input.value=String(value);input.style.position='fixed';input.style.opacity='0';document.body.append(input);try{input.select();if(!document.execCommand('copy'))throw Error('复制不可用')}finally{input.remove()}}toast('已复制标注文字')}catch(error){toast(`复制失败：${error.message}`)}}
  function copyAnnotation(i){const a=current()?.annotations[i];if(a)copyText(a.text??'')}
  function showMenu(x,y,target){clearSelectionToolbar();pending=target;const menu=$('label-menu');menu.innerHTML=`<div class="label-menu-title"><span>${target.type==='edit'?'修改类别':'新建标注'}</span><div class="label-menu-title-actions">${target.type==='edit'?'<button type="button" class="menu-delete">删除</button>':''}<button type="button" class="menu-copy">复制</button></div></div>`+M.LABELS.map(label=>`<button type="button" data-label="${label}" role="menuitem"><span class="menu-code">${label}</span><span class="menu-name">${names[label]}</span></button>`).join('');menu.hidden=false;const width=210,height=menu.offsetHeight;menu.style.left=`${Math.max(8,Math.min(x,innerWidth-width-8))}px`;menu.style.top=`${Math.max(8,Math.min(y,innerHeight-height-8))}px`;menu.querySelector('.menu-delete')?.addEventListener('click',()=>{removeAnnotation(target.index);hideMenu()});menu.querySelector('.menu-copy').onclick=()=>{const value=target.type==='edit'?current()?.annotations[target.index]?.text:M.cp(current()?.content).slice(target.start,target.end).join('');copyText(value??'')};menu.querySelectorAll('[data-label]').forEach(button=>button.onclick=()=>chooseLabel(button.dataset.label))}
  function hideMenu(){pending=null;$('label-menu').hidden=true}
  function chooseLabel(label){if(!pending)return;const doc=current();if(pending.type==='edit'){const a=doc.annotations[pending.index];if(a)M.setKind(a,label)}else{const {start,end}=pending;const a={id:newId(),start,end,text:'',desc_type:'DPR'};M.setRange(doc,a,start,end);M.setKind(a,label);doc.annotations.push(a);selected=doc.annotations.length-1}hideMenu();getSelection()?.removeAllRanges();$('add-selection').disabled=true;markChanged();renderEditor()}
  function pointOffset(node,offset){const element=node.nodeType===Node.TEXT_NODE?node.parentElement:node;if(!element||!$('context').contains(element))return null;const segment=element.closest('.segment[data-start]');if(!segment)return null;const base=Number(segment.dataset.start);if(node.nodeType===Node.TEXT_NODE)return base+M.cp(node.textContent.slice(0,offset)).length;if(node===segment)return base+(offset?M.cp(segment.textContent).length:0);return base}
  function selectedRange(){const selection=getSelection();if(!selection||selection.isCollapsed||!$('context').contains(selection.anchorNode)||!$('context').contains(selection.focusNode))return null;const a=pointOffset(selection.anchorNode,selection.anchorOffset),b=pointOffset(selection.focusNode,selection.focusOffset);if(a===null||b===null||a===b)return null;return {start:Math.min(a,b),end:Math.max(a,b)}}
  function caretAt(x,y){const range=document.caretRangeFromPoint?.(x,y);if(range)return pointOffset(range.startContainer,range.startOffset);const caret=document.caretPositionFromPoint?.(x,y);return caret?pointOffset(caret.offsetNode,caret.offset):null}
  function showDragCaret(x,y){const indicator=$('drag-caret'),area=$('context').getBoundingClientRect();indicator.hidden=true;if(x<area.left||x>area.right||y<area.top||y>area.bottom)return;let range=document.caretRangeFromPoint?.(x,y);if(!range){const caret=document.caretPositionFromPoint?.(x,y);if(caret){range=document.createRange();range.setStart(caret.offsetNode,caret.offset);range.collapse(true)}}if(!range||pointOffset(range.startContainer,range.startOffset)===null)return;const rect=range.getClientRects()[0]||range.getBoundingClientRect();if(!rect?.height)return;indicator.style.left=`${rect.left}px`;indicator.style.top=`${rect.top}px`;indicator.style.height=`${rect.height}px`;indicator.hidden=false}
  function stopRangeDrag(){dragging=null;document.documentElement.classList.remove('range-dragging');$('drag-caret').hidden=true}
  function createFromSelection(x,y,allowCharacter=false,useDraft=false){let range=selectedRange()||(useDraft&&selectionDraft&&String(selectionDraft.docId)===String(current()?.id)?selectionDraft:null);if(!range&&allowCharacter){const index=caretAt(x,y);if(index!==null&&index<M.cp(current().content).length)range={start:index,end:index+1}}if(!range)return false;showMenu(x,y,{type:'create',start:range.start,end:range.end});return true}
  function clearSelectionToolbar(){selectionDraft=null;selectionActionPress=false;$('selection-toolbar').hidden=true;$('add-selection').disabled=true;CSS.highlights?.delete('selection-draft')}
  function positionSelectionToolbar(range){if(!range)return;const rects=Array.from(range.getClientRects()).filter(rect=>rect.width&&rect.height),rect=rects.at(-1)||range.getBoundingClientRect(),bar=$('selection-toolbar');if(!rect?.height)return;bar.hidden=false;const width=bar.offsetWidth,height=bar.offsetHeight;bar.style.left=`${Math.max(8,Math.min(rect.right+8,innerWidth-width-8))}px`;bar.style.top=`${Math.max(8,Math.min(rect.bottom+8,innerHeight-height-8))}px`;if(rect.bottom+height+16>innerHeight)bar.style.top=`${Math.max(8,rect.top-height-8)}px`}
  function syncSelection(){if(!current()||pending?.type==='create')return;const range=selectedRange();if(range){const domRange=getSelection()?.rangeCount?getSelection().getRangeAt(0).cloneRange():null;selectionDraft={...range,docId:current().id,domRange,custom:false};$('add-selection').disabled=false;positionSelectionToolbar(domRange)}else if(!selectionActionPress&&!selectionDraft?.custom)clearSelectionToolbar()}
  function finalizeSelection(){if(pending?.type==='create')return;syncSelection();if(!selectionDraft?.domRange||!CSS.highlights||!window.Highlight)return;const range=selectionDraft.domRange;CSS.highlights.set('selection-draft',new Highlight(range));selectionDraft.custom=true;positionSelectionToolbar(range);getSelection()?.removeAllRanges()}
  $('context').addEventListener('mouseup',()=>{syncSelection();setTimeout(finalizeSelection,0)});
  $('context').addEventListener('keyup',syncSelection);
  $('context').addEventListener('touchend',()=>{setTimeout(finalizeSelection,80);setTimeout(finalizeSelection,250)},{passive:true});
  document.addEventListener('selectionchange',syncSelection);
  for(const id of ['add-selection','create-selection']){
    const button=$(id);
    button.addEventListener('pointerdown',e=>{selectionActionPress=true;if(e.pointerType==='mouse')e.preventDefault()});
    button.addEventListener('touchstart',()=>{selectionActionPress=true},{passive:true});
    button.onclick=e=>{const rect=e.currentTarget.getBoundingClientRect();if(!createFromSelection(rect.left,rect.top-8,false,true))toast('请先在正文中选中文字')};
  }
  $('context').addEventListener('contextmenu',e=>{e.preventDefault();if(createFromSelection(e.clientX,e.clientY,false,true))return;const mark=e.target.closest('.mark');if(mark)showMenu(e.clientX,e.clientY,{type:'edit',index:Number(mark.dataset.ann)});else createFromSelection(e.clientX,e.clientY,true)});
  $('context').addEventListener('click',e=>{if(dragging||selectionDraft?.custom||!getSelection()?.isCollapsed||e.target.closest('.edge'))return;const mark=e.target.closest('.mark');if(mark){selected=Number(mark.dataset.ann);renderContext();renderAnnotations();showMenu(e.clientX,e.clientY,{type:'edit',index:selected})}else hideMenu()});
  $('context').addEventListener('pointerdown',e=>{const edge=e.target.closest('.edge');if(!edge)return;e.preventDefault();e.stopPropagation();const mark=edge.closest('.mark');dragging={index:Number(mark.dataset.ann),side:edge.dataset.edge};document.documentElement.classList.add('range-dragging');showDragCaret(e.clientX,e.clientY)});
  document.addEventListener('pointermove',e=>{if(dragging)showDragCaret(e.clientX,e.clientY)});
  document.addEventListener('pointerup',e=>{if(!dragging)return;const {index,side}=dragging,pos=caretAt(e.clientX,e.clientY);stopRangeDrag();const doc=current(),a=doc?.annotations[index];if(!a||pos===null)return;try{M.setRange(doc,a,side==='start'?Math.min(pos,a.end-1):a.start,side==='end'?Math.max(pos,a.start+1):a.end);selected=index;markChanged();renderEditor();toast('标注范围已更新')}catch(error){toast(error.message)}});
  document.addEventListener('pointercancel',stopRangeDrag);
  window.addEventListener('blur',stopRangeDrag);
  document.addEventListener('pointerdown',e=>{if(selectionDraft?.custom&&!e.target.closest('#selection-toolbar,#add-selection,#label-menu')&&!(e.button===2&&e.target.closest('#context')))clearSelectionToolbar()},{capture:true});
  $('context').parentElement.addEventListener('scroll',()=>{if(selectionDraft?.domRange)positionSelectionToolbar(selectionDraft.domRange)},{passive:true});
  window.addEventListener('resize',()=>{if(selectionDraft?.domRange)positionSelectionToolbar(selectionDraft.domRange)});
  document.addEventListener('click',e=>{if(!e.target.closest('#label-menu,#selection-toolbar,#add-selection,.mark,[data-action]'))hideMenu()});
  document.addEventListener('dblclick',e=>{if(e.target.closest('.edge'))return;const mark=e.target.closest('.mark');if(mark){getSelection()?.removeAllRanges();removeAnnotation(Number(mark.dataset.ann));hideMenu();return}if(pending?.type==='edit'&&e.target.closest('#label-menu')&&!e.target.closest('button')){getSelection()?.removeAllRanges();removeAnnotation(pending.index);hideMenu()}});
  function applyFilter(saveLocation=true){const indices=visibleIndices();if(!indices.includes(active)){const next=indices[0]??(favoritesOnly?active:-1);if(next!==active){active=next;selected=-1;if(saveLocation)persist()}}if(favoritesOnly&&active>=0&&indices.includes(active)&&!favoriteResults().some(item=>item.docIndex===active&&item.annIndex===selected))selected=favoriteResults().find(item=>item.docIndex===active)?.annIndex??-1;renderDocuments();renderEditor()}
  $('query').addEventListener('input',applyFilter);$('scope').addEventListener('change',applyFilter);document.querySelectorAll('.category').forEach(button=>button.onclick=()=>{filterKind=button.dataset.kind;document.querySelectorAll('.category').forEach(b=>b.classList.toggle('active',b===button));applyFilter()});
  $('favorites-filter').onclick=()=>{favoritesOnly=!favoritesOnly;const button=$('favorites-filter');button.classList.toggle('active',favoritesOnly);button.setAttribute('aria-pressed',String(favoritesOnly));button.textContent=favoritesOnly?'★ 只看收藏':'☆ 只看收藏';$('query').placeholder=favoritesOnly?'在收藏标注或文档标题中搜索':'标题、正文、文档 ID 或标注文字';$('scope').options[0].textContent=favoritesOnly?'收藏文字 / 标题包含':'全文包含';renderCounts();applyFilter()};
  $('prev').onclick=()=>{const indices=visibleIndices(),i=indices.indexOf(active);if(i>0)openDoc(indices[i-1])};$('next').onclick=()=>{const indices=visibleIndices(),i=indices.indexOf(active);if(i>=0&&i<indices.length-1)openDoc(indices[i+1])};
  $('review-toggle').onclick=()=>toggleReview(active);
  $('skip-toggle').onclick=()=>toggleSkip(active);
  $('theme').onclick=()=>{theme=!theme;applyAppearance();try{localStorage.setItem('newprohect-theme',theme?'dark':'light')}catch{}};
  for(const style of ['notion','macos'])$('style-'+style).onclick=()=>{visualStyle=style;applyAppearance();try{localStorage.setItem('newprohect-style',style)}catch{}};
  $('wheel-toggle').onclick=()=>{reverseWheel=!reverseWheel;applyWheelPreference();try{localStorage.setItem('newprohect-wheel-reverse',String(reverseWheel))}catch{}};
  $('save-status').onclick=()=>{if(saveFailed)persist()};
  for(const [buttonId,panelId,label] of [['toggle-topbar','topbar','顶部栏'],['toggle-filterbar','filterbar','筛选栏']]){
    const button=$(buttonId),panel=$(panelId),key='newprohect-'+panelId+'-collapsed';
    try{panel.classList.toggle('collapsed',localStorage.getItem(key)==='true')}catch{}
    const update=()=>{const expanded=!panel.classList.contains('collapsed');button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?`收起${label} ▴`:`展开${label} ▾`};
    button.onclick=()=>{panel.classList.toggle('collapsed');try{localStorage.setItem(key,String(panel.classList.contains('collapsed')))}catch{}update()};
    update();
  }
  function triggerImport(){$('file').click()}$('import').onclick=triggerImport;$('welcome-import').onclick=triggerImport;
  $('file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{
    await readyPromise;
    if(savePromise)await savePromise;
    if(dirty)throw Error('当前修改尚未保存，请点击保存状态重试后再导入');
    const source=await file.text(),input=JSON.parse(source.replace(/^\uFEFF/,''));
    const imported=M.parseImport(input,file.name);
    const result={docs:imported.docs,session:{id:crypto.randomUUID(),name:imported.name.split(/[\\/]/).pop().slice(0,200),reviewed:imported.reviewed,activeDocId:imported.activeDocId,lastPendingDocId:imported.lastPendingDocId}};
    if(sessionId&&!confirm('导入会替换这台 iPad 上的当前工作区。请先确认已用“导出全部”保存需要的内容。继续导入吗？'))return;
    await S.save(result);
    docs=result.docs;reviewed=result.session.reviewed;lastPendingDocId=result.session.lastPendingDocId??null;sessionId=result.session.id;fileName=result.session.name;dirty=false;saveFailed=false;changeVersion=0;savedVersion=0;
    active=docs.findIndex(doc=>String(doc.id)===String(result.session.activeDocId));if(active<0)active=docs.length?0:-1;selected=-1;filterKind='all';favoritesOnly=false;$('favorites-filter').classList.remove('active');$('favorites-filter').setAttribute('aria-pressed','false');$('favorites-filter').textContent='☆ 只看收藏';$('query').value='';$('query').placeholder='标题、正文、文档 ID 或标注文字';$('scope').value='full';$('scope').options[0].textContent='全文包含';document.querySelectorAll('.category').forEach(b=>b.classList.toggle('active',b.dataset.kind==='all'));
    $('filename').textContent=fileName;$('export').disabled=false;resetExportWarning();saveStatus('已自动保存');renderCounts();renderDocuments();renderEditor();revealActiveDocument();toast(`已导入 ${docs.length} 篇文档`);
  }catch(error){toast(`导入失败：${error.message}`)}finally{e.target.value=''}};
  function locateExportOverlap(conflict){
    favoritesOnly=false;filterKind='all';$('favorites-filter').classList.remove('active');$('favorites-filter').setAttribute('aria-pressed','false');$('favorites-filter').textContent='☆ 只看收藏';$('query').value='';$('query').placeholder='标题、正文、文档 ID 或标注文字';$('scope').value='full';$('scope').options[0].textContent='全文包含';document.querySelectorAll('.category').forEach(button=>button.classList.toggle('active',button.dataset.kind==='all'));
    renderCounts();openDoc(conflict.docIndex);locateAnnotation(conflict.annotationIndex);revealActiveDocument();
  }
  function downloadJson(name,value){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
  $('export-mode').onchange=resetExportWarning;
  $('export').onclick=()=>{
    if(!docs.length)return;
    const mode=$('export-mode').value;
    if(mode==='all'){
      const output=M.exportAll(docs,reviewed,current()?.id??null,lastPendingDocId,fileName);
      const stamp=new Date().toISOString().replace(/[:.]/g,'-');
      downloadJson(fileName.replace(/\.json$/i,'')+'_all_'+stamp+'.json',output);
      resetExportWarning();toast('全部工作区已开始下载；请在“文件”App 确认文件已保存');return;
    }
    const indices=docs.map((_,i)=>i).filter(i=>reviewed[i]===true);
    const overlaps=M.exportOverlaps(indices.map(i=>docs[i])).map(conflict=>({...conflict,docIndex:indices[conflict.docIndex]}));
    if(overlaps.length&&!exportOverlapAcknowledged){
      exportOverlapAcknowledged=true;$('export').textContent=`仍然导出（${overlaps.length} 处重叠）`;
      locateExportOverlap(overlaps[0]);
      toast(`发现 ${overlaps.length} 处范围重叠，已定位第一处；检查后再次点击可导出`);
      return;
    }
    const name=fileName.replace(/\.json$/i,'')+'_reviewed.json',output=M.exportReviewed(docs,reviewed);
    downloadJson(name,output);resetExportWarning();
    toast(`已开始下载 ${name}（标注完 ${output.length} 篇）`);
  };
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
  async function restore(){
    try{
      const result=await S.load();
      if(result?.session){
        docs=M.parseCity(result.docs);reviewed=result.session.reviewed;lastPendingDocId=result.session.lastPendingDocId??null;sessionId=result.session.id;fileName=result.session.name;
        active=docs.findIndex(doc=>String(doc.id)===String(result.session.activeDocId));if(active<0)active=docs.length?0:-1;
        $('filename').textContent=fileName;$('export').disabled=!docs.length;saveStatus('已自动保存');
      }
    }catch(error){saveStatus('本地存储不可用',true);toast(`读取失败：${error.message}`)}
    renderCounts();renderDocuments();renderEditor();revealActiveDocument();
  }
  const readyPromise=restore();
  if('serviceWorker' in navigator&&location.protocol==='https:'){
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{
      $('offline-status').textContent='离线已就绪';$('offline-status').classList.add('ready');
    }).catch(error=>{$('offline-status').textContent='离线未就绪';toast(`离线安装失败：${error.message}`)});
  }else $('offline-status').textContent='离线未就绪';
})();
