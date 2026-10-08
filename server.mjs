import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const BASE = 'https://api.parse.bot/scraper/12ac6f45-949a-4b24-ba4b-c6da49dbd41a';
const HOST = '127.0.0.1';
// Dynamic loopback port by default: avoids opening some other app on a fixed port.
const PORT = process.env.PORT ? Number(process.env.PORT) : 0;

// Keep secrets in .env on your own machine, never in the public/ directory.
try {
  const env = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z_0-9]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
} catch (err) { if (err.code !== 'ENOENT') console.error('Kon .env niet lezen:', err.message); }

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(body);
}
function getErrorMessage(body, status) {
  const hint = body?.message || body?.error?.message || body?.error || body?.detail || body?.status || 'Onbekende fout';
  if (status === 401 || status === 403) return `API-sleutel ontbreekt of wordt geweigerd (${status}). Controleer je .env en je Parse-account.`;
  if (status === 429) return 'De API-limiet is bereikt (429). Probeer later opnieuw; het gratis plan heeft een verzoeklimiet.';
  if (status === 402) return 'Er zijn onvoldoende API-credits (402).';
  if (status >= 500) return `Externe API tijdelijk niet beschikbaar (${status}).`;
  return `${typeof hint === 'string' ? hint : JSON.stringify(hint).slice(0,180)} (HTTP ${status})`;
}
async function parseCall(endpoint, params) {
  const key = process.env.PARSE_API_KEY?.trim();
  if (!key) return { ok:false, status: 503, error:'Geen API-sleutel ingesteld. Open .env en vul PARSE_API_KEY in. Handmatig importeren werkt wel.' };
  const url = new URL(`${BASE}/${endpoint}`);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,String(v)));
  let response;
  try {
    response = await fetch(url, {headers:{'X-API-Key':key,'Accept':'application/json'},signal:AbortSignal.timeout(25000)});
  } catch(e) {
    return {ok:false,status:502,error:e.name === 'TimeoutError' ? 'De API reageert niet binnen 25 seconden.' : `Netwerkfout richting Parse: ${e.message}`};
  }
  const raw = await response.text();
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { return {ok:false,status:502,error:`Parse stuurde geen JSON terug (HTTP ${response.status}).`,details:raw.slice(0,160)}; }
  if (!response.ok || parsed?.status === 'error' || parsed?.status === 'failed' || parsed?.error) {
    return {ok:false,status:response.ok?502:response.status,error:getErrorMessage(parsed,response.status),details:JSON.stringify(parsed).slice(0,250)};
  }
  const data = parsed?.data ?? parsed;
  return {ok:true,status:200,data};
}
function validTabURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && (u.hostname === 'ultimate-guitar.com' || u.hostname.endsWith('.ultimate-guitar.com')) && u.pathname.startsWith('/tab/') && !u.username && !u.password;
  } catch { return false; }
}
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.ico':'image/x-icon'};
async function app(req,res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  if (req.method !== 'GET') return json(res,405,{error:'Alleen GET wordt ondersteund.'});
  if (url.pathname === '/api/health') return json(res,200,{app:'Chordroom',version:'2.0',mode:'local'});
  if (url.pathname === '/api/config') return json(res,200,{app:'Chordroom',apiConfigured:Boolean(process.env.PARSE_API_KEY?.trim()),mode:'local'});
  if (url.pathname === '/api/search') {
    const query = (url.searchParams.get('q') || '').trim();
    if (query.length < 2 || query.length > 120) return json(res,400,{error:'Voer minimaal 2 en maximaal 120 tekens in.'});
    const r = await parseCall('search_songs',{query, tab_type:'chords',page:1});
    if (!r.ok) return json(res,r.status,{error:r.error,details:r.details});
    const rows = r.data?.results;
    if (!Array.isArray(rows)) return json(res,502,{error:'Onverwachte zoekrespons van Parse.',received:Object.keys(r.data||{})});
    return json(res,200,{results:rows.filter(x=>validTabURL(x.url)).map(x=>({url:x.url,artist_name:x.artist_name,song_name:x.song_name,version:x.version,tonality:x.tonality,rating:x.rating,votes:x.votes,type:x.type})),total_results:r.data.total_results});
  }
  if (url.pathname === '/api/chart') {
    const chartURL = url.searchParams.get('url');
    if (!validTabURL(chartURL)) return json(res,400,{error:'Geen geldige Ultimate Guitar-akkoordenlink.'});
    const r = await parseCall('get_chord_chart',{tab_url:chartURL});
    if (!r.ok) return json(res,r.status,{error:r.error,details:r.details});
    const data = r.data || {};
    const chart = data.chord_chart || data.raw_chart;
    if (typeof chart !== 'string' || !chart.trim()) return json(res,502,{error:'De API gaf wel een antwoord, maar zonder akkoordenschema.',received:Object.keys(data)});
    return json(res,200,{chart,raw_chart:data.raw_chart||'',title:data.song_name||'',artist:data.artist_name||'',capo:data.capo??0,key:data.tonality||'',url:chartURL});
  }
  if (url.pathname.startsWith('/api/')) return json(res,404,{error:'Onbekend endpoint.'});
  const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const candidate = path.resolve(PUBLIC,file);
  if (candidate !== PUBLIC && !candidate.startsWith(PUBLIC+path.sep)) return json(res,403,{error:'Verboden'});
  try {
    const stat = await fs.stat(candidate);
    if (!stat.isFile()) throw Object.assign(new Error('geen bestand'),{code:'ENOENT'});
    const content = await fs.readFile(candidate);
    res.writeHead(200,{'Content-Type':mime[path.extname(candidate)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});
    res.end(content);
  } catch(e) { json(res,404,{error:'Bestand niet gevonden'}); }
}
if (path.resolve(process.argv[1] || '') !== fileURLToPath(import.meta.url)) {
  // Imported by tests: do not start a listening server.
} else if (process.argv.includes('--self-test')) {
  console.log('server self-test:', validTabURL('https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-6125') && !validTabURL('https://evil.example.com/tab/x') && !validTabURL('https://tabs.ultimate-guitar.com.evil.net/tab/x') ? 'OK':'FOUT');
} else {
  const server = http.createServer((req,res)=>app(req,res).catch(err=>{console.error(err);if(!res.headersSent)json(res,500,{error:'Interne serverfout.'});}));
  server.listen(PORT,HOST,()=>{
    const url=`http://${HOST}:${server.address().port}/`;
    console.log(`\nCHORDROOM 2.0 - ${url}`);
    console.log(process.env.PARSE_API_KEY ? 'Ultimate Guitar API: sleutel ingesteld' : 'Ultimate Guitar API: geen sleutel; handmatige import werkt');
    console.log('Sluit dit venster om de server te stoppen.\n');
    if(process.argv.includes('--open') && process.platform==='win32') {
      const child=spawn('cmd',['/c','start','',url],{detached:true,stdio:'ignore',windowsHide:true});
      child.on('error',err=>console.warn('Browser openen mislukte. Open handmatig:',url,err.message));
      child.unref();
    }
  });
}
export {app, validTabURL, parseCall};
