import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const args=['server.mjs'];
async function boot(){
 const p=spawn(process.execPath,args,{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 let t='';
 const url=await Promise.race([
  new Promise((resolve,reject)=>p.stdout.on('data',buf=>{t+=buf.toString();const m=t.match(/http:\/\/127\.0\.0\.1:(\d+)\//);if(m)resolve(m[0]);})),
  new Promise((_,reject)=>setTimeout(()=>reject(new Error('server timed out')),7000))
 ]);
 return {p,url};
}
const a=await boot();const b=await boot();
try{
 assert.notEqual(a.url,b.url,'ports must be unique');
 for(const {url} of [a,b]){
  const health=await fetch(url+'api/health').then(x=>x.json());
  assert.equal(health.app,'Chordroom');
  const html=await fetch(url).then(x=>x.text());
  assert.ok(html.includes('data-theme="dark"'));
  const config=await fetch(url+'api/config').then(x=>x.json());
  assert.equal(config.app,'Chordroom');
 }
 console.log('✓ 2 servers start with different dynamic ports and each serves Chordroom.');
}finally{a.p.kill();b.p.kill();}
