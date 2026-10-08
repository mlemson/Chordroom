import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{validChartUrl} from '../src/index.js';

const ORIGIN='https://mlemson.github.io';
const ENV={PARSE_API_KEY:'test-api-key',CHORDROOM_ACCESS_CODE:'my-secret-pass-2026'};
function req(path,code='my-secret-pass-2026',origin=ORIGIN,method='GET'){
  const h=new Headers({'Origin':origin});
  if(code)h.set('X-Chordroom-Code',code);
  return new Request('https://chordroom-test.workers.dev'+path,{method,headers:h});
}
async function asJSON(r){return [r.status,await r.json()];}
test('restricts tab URLs to legitimate Ultimate Guitar tab pages',()=>{
 assert.ok(validChartUrl('https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-6125'));
 assert.ok(!validChartUrl('https://evil.test/tab/abc'));
 assert.ok(!validChartUrl('https://ultimate-guitar.com.evil.test/tab/foo'));
 assert.ok(!validChartUrl('http://tabs.ultimate-guitar.com/tab/test'));
});
test('preflight works for Github Pages and blocks untrusted sites',async()=>{
 const r=await worker.fetch(req('/api/search','',ORIGIN,'OPTIONS'),ENV);
 assert.equal(r.status,204);
 assert.equal(r.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal((await worker.fetch(req('/api/health','', 'https://evil.test'),ENV)).status,403);
});
test('reports config safely with no secret values',async()=>{
 const [code,data]=await asJSON(await worker.fetch(req('/api/config',''),ENV));
 assert.equal(code,200);
 assert.equal(data.apiConfigured,true);
 assert.equal(data.accessProtected,true);
 assert.ok(!JSON.stringify(data).includes(ENV.PARSE_API_KEY));
});
test('requires access code on every billable API endpoint',async()=>{
 const [status]=await asJSON(await worker.fetch(req('/api/search?q=yellow','wrong'),ENV));
 assert.equal(status,401);
 const r=await worker.fetch(req('/api/chart?url=https%3A%2F%2Ftabs.ultimate-guitar.com%2Ftab%2Fa%2Fb',''),ENV);
 assert.equal(r.status,401);
});
test('requires configured access code and API token',async()=>{
 assert.equal((await worker.fetch(req('/api/search?q=yellow'),{...ENV,CHORDROOM_ACCESS_CODE:''})).status,503);
 assert.equal((await worker.fetch(req('/api/search?q=yellow'),{...ENV,PARSE_API_KEY:''})).status,503);
});
test('validates malformed user inputs before calling provider',async()=>{
 assert.equal((await worker.fetch(req('/api/search?q=a'),ENV)).status,400);
 assert.equal((await worker.fetch(req('/api/search?q=coldplay&page=999'),ENV)).status,400);
 assert.equal((await worker.fetch(req('/api/chart?url=https%3A%2F%2Fattacker.com%2F'),ENV)).status,400);
});
test('search and chart API contracts return browser-compatible JSON',async()=>{
 const old=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async (url,opts)=>{
  calls.push([String(url),opts.headers['X-API-Key']]);
  if(String(url).includes('/search_songs')){
   return new Response(JSON.stringify({data:{results:[
    {url:'https://tabs.ultimate-guitar.com/tab/a/b-chords-123',song_name:'Example Song',artist_name:'Artist',type:'Chords',rating:4.2,votes:800},
    {url:'https://evil.example/tab/not',song_name:'Evil'},
    {url:'https://tabs.ultimate-guitar.com/tab/a/other-chords-124',song_name:'Other',artist_name:'Artist',type:'Chords',rating:5,votes:1000}
   ],total_results:3}}),{status:200});
  }
  return new Response(JSON.stringify({data:{chord_chart:'[C]This is a [G]test',song_name:'Example Song',artist_name:'Artist',capo:2,tonality:'D'}}),{status:200});
 };
 try {
  const [sCode,s]=await asJSON(await worker.fetch(req('/api/search?q=artist%20example'),ENV));
  assert.equal(sCode,200);
  assert.equal(s.results.length,2);
  assert.equal(s.results[0].song_name,'Other');
  const chart=await asJSON(await worker.fetch(req('/api/chart?url=https%3A%2F%2Ftabs.ultimate-guitar.com%2Ftab%2Fa%2Fb-chords-123'),ENV));
  assert.equal(chart[0],200);
  assert.equal(chart[1].chart,'[C]This is a [G]test');
  assert.equal(chart[1].capo,2);
  assert.equal(calls.length,2);
  assert.ok(calls.every(c=>c[1]===ENV.PARSE_API_KEY));
 } finally {globalThis.fetch=old;}
});
test('provider failures are clear and sanitized',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({error:'No credits'}),{status:402});
 try {
  const [status,data]=await asJSON(await worker.fetch(req('/api/search?q=test'),ENV));
  assert.equal(status,402);assert.match(data.error,/tegoed/i);
 }finally{globalThis.fetch=old;}
});
