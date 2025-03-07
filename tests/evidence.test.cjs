const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateDraft, finalize, fresh, missing, ISSUES } = require('../lib/evidence.ts');
const { research } = require('../lib/research.ts');
const { sourceUrl, readArticle } = require('../lib/articles.ts');
const quote = 'In 2024, Example Candidate proposed reducing corporate taxes.';
const evidence = [{ id: 'S1', text: Array(6).fill(quote).join(' '), title: 'Tax policy', url: 'https://apnews.com/article/tax', source: 'apnews.com', evidenceType: 'article' }];
const draft = { issues: [{ issue: ISSUES[0], claims: [{ text: 'In 2024, the candidate proposed a corporate tax reduction.', citations: [{ id: 'S1', quote }] }] }] };

test('rejects invented source IDs, altered quotes and more than three sources', () => {
  const raw = structuredClone(draft); raw.issues[0].claims[0].citations[0].id = 'FAKE';
  assert.equal(validateDraft(raw, evidence, [ISSUES[0]])[0].claims.length, 0);
  raw.issues[0].claims[0].citations[0] = { id: 'S1', quote: 'The tax cut was enacted into law.' };
  assert.equal(validateDraft(raw, evidence, [ISSUES[0]])[0].claims.length, 0);
  const four = [1,2,3,4].map(i => ({ ...evidence[0], id: 'S'+i, url: 'https://apnews.com/article/'+i }));
  raw.issues[0].claims[0].citations = four.map(e => ({ id: e.id, quote }));
  assert.equal(validateDraft(raw, four, [ISSUES[0]])[0].claims.length, 0);
});
test('requires reviewer approval and maps citations to retrieved URLs', () => {
  const drafts = validateDraft(draft, evidence, [ISSUES[0]]);
  assert.equal(finalize(drafts, evidence, { approvals: [] })[0].claims.length, 0);
  const result = finalize(drafts, evidence, { approvals: [{ issue: ISSUES[0], claimIndex: 0, supported: true }] })[0];
  assert.equal(result.sources[0].url, evidence[0].url);
  assert.equal(result.claims[0].citations[0].sourceIndex, 0);
});
test('partial cache lasts 24 hours, supported cache 30 days, legacy is rejected', () => {
  const partial = missing(ISSUES[0]); const now = Date.parse(partial.checkedAt);
  assert.equal(fresh(partial, now + 23*3600000), true);
  assert.equal(fresh(partial, now + 25*3600000), false);
  assert.equal(fresh({ ...partial, claims: [{}] }, now + 29*86400000), true);
  assert.equal(fresh({ ...partial, claims: [{}] }, now + 31*86400000), false);
  assert.equal(fresh({ ...partial, evidenceVersion: undefined }), false);
});
test('cached alias bypasses every paid API, including name recognition', async () => {
  let calls = 0;
  const result = await research('example', () => {}, {
    find: async () => ({ name: 'Example Candidate', stances: ISSUES.map(i => missing(i)) }),
    alias: async () => {}, save: async () => {}, json: async () => { calls++; throw Error(); }, search: async () => { calls++; throw Error(); }, read: async e => e
  });
  assert.equal(result.cached, true); assert.equal(calls, 0);
});
test('provider failure is saved and repeated search does not retry', async () => {
  let saved; let searches=0; let gpt=0;
  const deps = { find: async () => saved ? { name: saved.candidateName, stances: saved.stances } : null,
    alias: async () => {}, save: async r => { saved = r; }, json: async () => { gpt++; return { name: 'Example Candidate' }; },
    search: async () => { searches++; throw Error('quota'); }, read: async e => e };
  await assert.rejects(research('example', () => {}, deps), /temporarily unavailable/);
  await assert.rejects(research('example', () => {}, deps), /temporarily unavailable/);
  assert.equal(searches, 1); assert.equal(gpt, 1); assert.equal(saved.stances.length, 12);
});
test('cache outage stops before paid calls', async () => {
  await assert.rejects(research('example', () => {}, { find: async () => { throw Error('db down'); }, json: async () => assert.fail('paid call') }));
});
test('unsafe URLs and redirects are not fetched', async () => {
  for (const u of ['http://apnews.com/x','https://apnews.com.evil.test/x','https://127.0.0.1/x','https://apnews.com:8443/x','https://user@apnews.com/x']) assert.equal(sourceUrl(u), null);
  let calls = 0;
  const result = await readArticle(evidence[0], async () => { calls++; return new Response('', { status: 302, headers: { location: 'http://169.254.169.254/' } }); });
  assert.equal(calls, 1); assert.equal(result, evidence[0]);
});
test('failed semantic review never returns a model-written unsupported stance', async () => {
  let saved; let calls=0;
  await research('Example Candidate', () => {}, { find: async () => ({ name:'Example Candidate', stances:[] }), alias:async()=>{}, save:async r=>{saved=r},
    search:async()=>evidence, read:async e=>e, json:async()=>++calls===1?{issues:[{issue:ISSUES[0],passageIds:['S1P0']}]}:{approvals:[]} });
  assert.equal(saved.stances.every(s=>s.claims.length===0),true);
});
test('refreshes expired gaps without regenerating fresh supported issues', async () => {
  const cached = ISSUES.map(i => missing(i));
  cached[0] = finalize(validateDraft(draft, evidence, [ISSUES[0]]), evidence, { approvals: [{ issue:ISSUES[0],claimIndex:0,supported:true }] })[0];
  cached[1].checkedAt = new Date(Date.now()-2*86400000).toISOString();
  let searches=0; let saved;
  await research('example',()=>{}, { find:async()=>({name:'Example Candidate',stances:cached}),alias:async()=>{},save:async r=>{saved=r},
    search:async()=>{searches++;return []},read:async e=>e,json:async()=>assert.fail('No model call without evidence') });
  assert.equal(searches,1); assert.deepEqual(saved.stances[0],cached[0]); assert.ok(fresh(saved.stances[1]));
});
test('cards show full clickable URLs and cap displayed sources at three', () => {
  require.extensions['.tsx'] = (module,file) => module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);
  const React = require('react'); const {renderToStaticMarkup} = require('react-dom/server');
  const {StanceCard} = require('../components/StanceCard.tsx');
  const stance=finalize(validateDraft(draft,evidence,[ISSUES[0]]),evidence,{approvals:[{issue:ISSUES[0],claimIndex:0,supported:true}]})[0];
  stance.sources=[1,2,3,4].map(i=>({...evidence[0],url:`https://apnews.com/article/${i}`,evidenceType:'search-excerpt'}));
  const html=renderToStaticMarkup(React.createElement(StanceCard,{stance}));
  for (const i of [1,2,3]) assert.ok(html.includes(`>https://apnews.com/article/${i}</a>`));
  assert.ok(!html.includes('https://apnews.com/article/4'));
  assert.ok(html.includes('Search excerpt only'));
});
test('search-generated prose is never treated as evidence', () => {
  const {citationSources}=require('../lib/websearch.ts');
  const sources=citationSources([{type:'message',content:[{text:'Invented story https://apnews.com/invented',annotations:[{type:'url_citation',url:'https://www.whitehouse.gov/test',title:'Official document'}]}]}]);
  assert.equal(sources.length,1);assert.equal(sources[0].text,'');assert.equal(sources[0].url,'https://www.whitehouse.gov/test');
});
test('provider outages expire after 15 minutes and old failure caches are invalid',()=>{
  const {unavailable}=require('../lib/evidence.ts');const s=unavailable(ISSUES[0]);const time=Date.parse(s.checkedAt);
  assert.equal(fresh(s,time+14*60000),true);assert.equal(fresh(s,time+16*60000),false);
  assert.equal(fresh({...s,evidenceVersion:2},time),false);
});
test('selected claims use exact retrieved text, never model prose',()=>{
  const {passages,selectedClaims}=require('../lib/evidence.ts');const p=passages(evidence);
  const rows=selectedClaims({issues:[{issue:ISSUES[0],passageIds:[p[0].id,'invented'],text:'Made up policy'}]},p,[ISSUES[0]]);
  assert.equal(rows[0].claims.length,1);assert.ok(rows[0].claims[0].text.includes(p[0].text));assert.ok(!rows[0].claims[0].text.includes('Made up'));
});
test('evidence payload is bounded and preserves source diversity',()=>{
  const {passages}=require('../lib/evidence.ts');const many=Array.from({length:30},(_,i)=>({...evidence[0],id:'S'+i,text:Array(20).fill('This is a long policy statement about a candidate and a specific issue that has enough context for source review.').join(' ')}));
  const p=passages(many);assert.ok(p.length<=120);assert.ok(p.reduce((n,e)=>n+e.text.length,0)<=22000);assert.equal(new Set(p.map(e=>e.id.split('P')[0])).size,30);
});
