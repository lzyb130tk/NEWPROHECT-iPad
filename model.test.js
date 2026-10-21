const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('./model.js');

const doc=(id,annotations=[])=>({id,content:'正文',annotations});

test('reviewed export restores completed status without changing the working documents',()=>{
  const docs=[doc(1),doc(2)];
  const exported=M.exportReviewed(docs,[true,false]);
  assert.deepEqual(exported,[{...doc(1),review_completed:true}]);
  assert.equal(Object.hasOwn(docs[0],'review_completed'),false);
  const imported=M.parseImport(JSON.parse(JSON.stringify(exported)),'renamed.json');
  assert.deepEqual(imported.reviewed,[true]);
  assert.equal(Object.hasOwn(imported.docs[0],'review_completed'),false);
  assert.equal(imported.lastPendingDocId,null);
});

test('older reviewed files restore status by their generated filenames',()=>{
  for(const name of ['city_reviewed.json','city_reviewed_without_dpr_only.json']){
    assert.deepEqual(M.parseImport([doc(1)],name).reviewed,[true]);
  }
  assert.deepEqual(M.parseImport([doc(1)],'city.json').reviewed,[false]);
});

test('workspace export keeps mixed completion state',()=>{
  const docs=[doc(1),doc(2)];
  const backup=M.exportAll(docs,[true,false],1,2,'city.json');
  const imported=M.parseImport(backup,'city_all.json');
  assert.deepEqual(imported.reviewed,[true,false]);
  assert.equal(imported.lastPendingDocId,2);
});

test('all categories locates matching annotations and drops documents after deletion',()=>{
  const first={id:1,content:'山顶有观景台',annotations:[
    {start:3,end:6,text:'观景台',desc_type:'DPR'},
    {start:0,end:2,text:'山顶',desc_type:'CPR',cpr_pattern:'RBL'}
  ]};
  const second={id:2,content:'山顶远眺',annotations:[
    {start:0,end:2,text:'山顶',desc_type:'DPR'}
  ]};
  const matches=docs=>docs.filter(doc=>M.searchDoc(doc,'观景','contains'));
  assert.deepEqual(matches([first,second]).map(doc=>doc.id),[1]);
  assert.deepEqual(M.matchingAnnotationIndices(first,'all','观景','contains'),[0]);
  first.annotations.splice(0,1);
  assert.deepEqual(matches([first,second]),[]);
  assert.deepEqual(M.matchingAnnotationIndices(first,'all','观景','contains'),[]);
});
