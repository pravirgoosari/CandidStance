const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fresh, missing, unavailable, ISSUES, EVIDENCE_VERSION } = require('../lib/evidence.ts');
const { research } = require('../lib/research.ts');
const { sourceUrl } = require('../lib/sources.ts');
const { citedSummary } = require('../lib/websearch.ts');
function output(rows) {
  let text=''; const annotations=[];
  for(const [summary,url] of rows) {
    text+=summary+' ';
    if(url) {const marker=`([source](${url}))`;annotations.push({type:'url_citation',url,title:'Policy reporting',start_index:text.length,end_index:text.length+marker.length});text+=marker;}
    text+='\n\n';
  }
  return [{type:'message',content:[{type:'output_text',text,annotations}]}];
}
const sentence='The candidate supports lowering corporate taxes while maintaining existing personal tax rates.';
const supported = issue => citedSummary(output([[sentence,'https://apnews.com/article/taxes']]),issue);
test('renders an AI summary with provider citations instead of copied excerpts',()=>{
 const s=supported(ISSUES[0]);assert.equal(s.stance,sentence);assert.equal(s.claims[0].citations[0].sourceIndex,0);assert.equal(s.sources.length,1);
});
test('excludes Wikipedia, spoofed hosts, unsafe URLs and uncited model links',()=>{
 for(const url of ['https://en.wikipedia.org/wiki/Trump','https://apnews.com.evil.test/x','http://apnews.com/x','https://user@apnews.com/x','https://127.0.0.1/','https://apnews.com:8443/x']) assert.equal(sourceUrl(url),null);
 assert.throws(()=>citedSummary(output([[sentence,'https://en.wikipedia.org/wiki/Trump']]),ISSUES[0]));
 assert.throws(()=>citedSummary(output([[sentence+' https://apnews.com/invented',null]]),ISSUES[0]));
});
test('discards an entire paragraph with excluded evidence, preserves supported paragraphs',()=>{
 const o=output([[sentence,'https://apnews.com/a'],['An unsupported assertion without a citation.',null],[sentence,'https://en.wikipedia.org/wiki/X']]);
 const s=citedSummary(o,ISSUES[0]);assert.equal(s.claims.length,1);assert.equal(s.sources.length,1);
});
test('limits to three sources without keeping claims whose references were dropped',()=>{
 const s=citedSummary(output([1,2,3,4].map(i=>[sentence+' '+i,'https://apnews.com/'+i])),ISSUES[0]);
 assert.equal(s.sources.length,3);assert.equal(s.claims.length,3);assert.ok(!s.stance.endsWith('4'));
});
test('deduplicates citation URLs and strips tracking parameters',()=>{
 const s=citedSummary(output([[sentence,'https://apnews.com/a?utm_source=openai'],[sentence,'https://apnews.com/a']]),ISSUES[0]);
 assert.equal(s.sources.length,1);assert.equal(s.sources[0].url,'https://apnews.com/a');assert.equal(s.claims[1].citations[0].sourceIndex,0);
});
test('rejects invalid annotation offsets',()=>{
 const o=output([[sentence,'https://apnews.com/a']]);o[0].content[0].annotations[0].end_index=99999;assert.throws(()=>citedSummary(o,ISSUES[0]));
});
test('supported cache lasts 30 days, temporary failures 15 minutes, old quote cards expire',()=>{
 const s=supported(ISSUES[0]),now=Date.parse(s.checkedAt);
 assert.equal(fresh(s,now+29*86400000),true);assert.equal(fresh(s,now+31*86400000),false);
 assert.equal(fresh({...s,evidenceVersion:EVIDENCE_VERSION-1},now),false);
 const u=unavailable(ISSUES[0]),time=Date.parse(u.checkedAt);assert.equal(fresh(u,time+14*60000),true);assert.equal(fresh(u,time+16*60000),false);
});
test('cached alias bypasses all paid calls',async()=>{
 const result=await research('trump',()=>{},{find:async()=>({name:'Donald Trump',stances:ISSUES.map(supported)}),alias:async()=>{},json:async()=>assert.fail('paid resolution'),search:async()=>assert.fail('paid search')});assert.equal(result.cached,true);
});
test('one topic failure does not block research on other topics and is cached',async()=>{
 let saved,calls=0;const deps={find:async()=>({name:'Donald Trump',stances:saved?.stances||[]}),alias:async()=>{},save:async r=>{saved=r},search:async(name,issue)=>{calls++;if(issue===ISSUES[0])throw Error('timeout');return supported(issue)}};
 const result=await research('trump',()=>{},deps);assert.equal(result.stances.filter(s=>s.evidenceStatus==='supported').length,11);assert.equal(calls,12);
 await research('trump',()=>{},deps);assert.equal(calls,12);
});
test('quota failure stops remaining paid calls and repeated requests',async()=>{
 let saved,calls=0;const deps={find:async()=>({name:'Donald Trump',stances:saved?.stances||[]}),alias:async()=>{},save:async r=>{saved=r},search:async()=>{calls++;throw Object.assign(Error('quota'),{status:429})}};
 await assert.rejects(research('trump',()=>{},deps),/temporarily unavailable/);await assert.rejects(research('trump',()=>{},deps),/temporarily unavailable/);assert.equal(calls,1);
});
test('cache outage prevents paid research',async()=>{
 await assert.rejects(research('trump',()=>{},{find:async()=>{throw Error('db down')},search:async()=>assert.fail('paid call')}));
});
test('only expired issues are refreshed',async()=>{
 const stances=ISSUES.map(supported);stances[0].checkedAt=new Date(Date.now()-31*86400000).toISOString();let calls=0;
 await research('trump',()=>{},{find:async()=>({name:'Donald Trump',stances}),alias:async()=>{},save:async()=>{},search:async(name,issue)=>{calls++;assert.equal(issue,ISSUES[0]);return supported(issue)}});assert.equal(calls,1);
});
test('card puts summary before up to three full clickable source URLs',()=>{
 require.extensions['.tsx']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{StanceCard}=require('../components/StanceCard.tsx');
 const stance=supported(ISSUES[0]);stance.sources=[1,2,3,4].map(i=>({...stance.sources[0],url:'https://apnews.com/'+i}));
 const html=renderToStaticMarkup(React.createElement(StanceCard,{stance}));
 assert.ok(html.indexOf(sentence)<html.indexOf('>Sources<'));for(const i of [1,2,3])assert.ok(html.includes('>https://apnews.com/'+i+'</a>'));assert.ok(!html.includes('https://apnews.com/4'));assert.ok(!html.includes('Supporting excerpts'));
});
test('search Highlights and published-date fragments never enter summaries',()=>{
 const o=output([[sentence,'https://apnews.com/a']]);o[0].content[0].text+='## Highlights:\n';
 const extra=output([['More news headline, Published on Tuesday','https://apnews.com/b']])[0].content[0];const offset=o[0].content[0].text.length;o[0].content[0].text+=extra.text;o[0].content[0].annotations.push(...extra.annotations.map(a=>({...a,start_index:a.start_index+offset,end_index:a.end_index+offset})));
 const s=citedSummary(o,ISSUES[0]);assert.equal(s.claims.length,1);assert.equal(s.sources.length,1);
});
test('synthesis preserves citation mapping and rejects invented source references',()=>{
 const {validatedSynthesis}=require('../lib/websearch.ts');const e=citedSummary(output([[sentence,'https://apnews.com/a'],[sentence,'https://www.reuters.com/b']]),ISSUES[0]);
 const s=validatedSynthesis({claims:[{text:sentence,sourceIndices:[1]},{text:sentence,sourceIndices:[0,1]}]},e);
 assert.equal(s.sources[0].url,'https://www.reuters.com/b');assert.deepEqual(s.claims[1].citations,[{sourceIndex:1},{sourceIndex:0}]);
 assert.throws(()=>validatedSynthesis({claims:[{text:sentence,sourceIndices:[9]}]},e));assert.throws(()=>validatedSynthesis({claims:[{text:sentence,sourceIndices:[]}]},e));
});
