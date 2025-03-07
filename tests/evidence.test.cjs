const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateDraft, finalize, fresh, missing, ISSUES } = require('../lib/evidence.ts');
const { research } = require('../lib/research.ts');
const { sourceUrl, searchEvidence, readArticle } = require('../lib/googleapi.ts');
const quote = 'In 2024, Example Candidate proposed reducing corporate taxes.';
const evidence = [{ id: 'S1', text: quote, title: 'Tax policy', url: 'https://apnews.com/article/tax', source: 'apnews.com', evidenceType: 'search-excerpt' }];
const draft = { issues: [{ issue: ISSUES[0], claims: [{ text: 'In 2024, the candidate proposed a corporate tax reduction.', citations: [{ id: 'S1', quote }] }] }] };

test('rejects invented source IDs, altered quotes and more than three sources', () => {
  const raw = structuredClone(draft); raw.issues[0].claims[0].citations[0].id = 'FAKE';
  assert.equal(validateDraft(raw, evidence, [ISSUES[0]])[0].claims.length, 0);
  raw.issues[0].claims[0].citations[0] = { id: 'S1', quote: 'The tax cut was enacted into law.' };
  assert.equal(validateDraft(raw, evidence, [ISSUES[0]])[0].claims.length, 0);
  const four = [1,2,3,4].map(i => ({ ...evidence[0], id: 'S'+i }));
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
  await research('example', () => {}, deps); await research('example', () => {}, deps);
  assert.equal(searches, 1); assert.equal(gpt, 1); assert.equal(saved.stances.length, 12);
});
test('cache outage stops before paid calls', async () => {
  await assert.rejects(research('example', () => {}, { find: async () => { throw Error('db down'); }, json: async () => assert.fail('paid call') }));
});
test('unsafe URLs and redirects are not fetched', async () => {
  for (const u of ['http://apnews.com/x','https://apnews.com.evil.test/x','https://127.0.0.1/x','https://apnews.com:8443/x','https://user@apnews.com/x']) assert.equal(sourceUrl(u), null);
  let calls = 0;
  const result = await readArticle(evidence[0], async () => { calls++; return new Response('', { status: 302, headers: { location: 'http://169.254.169.254/' } }); });
  assert.equal(calls, 1); assert.equal(result.evidenceType, 'search-excerpt');
});
test('search accepts actual provider shape, deduplicates and caps three results', async () => {
  const result = await searchEvidence('Example Candidate', 'tax policy', async (_, options) => {
    assert.ok(JSON.parse(options.body).text.length < 100);
    return Response.json({ result: [1,2,3,4].map(i => ({ title:'Title',href:`https://apnews.com/article/${i}`,body:quote })) });
  });
  assert.equal(result.length, 3);
});
test('failed semantic review never returns a model-written unsupported stance', async () => {
  let saved; let calls=0;
  await research('Example Candidate', () => {}, { find: async () => ({ name:'Example Candidate', stances:[] }), alias:async()=>{}, save:async r=>{saved=r},
    search:async()=>evidence, read:async e=>e, json:async()=>++calls===1?draft:{approvals:[]} });
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
  stance.sources=[1,2,3,4].map(i=>({...evidence[0],url:`https://apnews.com/article/${i}`}));
  const html=renderToStaticMarkup(React.createElement(StanceCard,{stance}));
  for (const i of [1,2,3]) assert.ok(html.includes(`>https://apnews.com/article/${i}</a>`));
  assert.ok(!html.includes('https://apnews.com/article/4'));
  assert.ok(html.includes('Search excerpt only'));
});
