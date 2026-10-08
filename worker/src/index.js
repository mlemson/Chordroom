// Chordroom API: private Parse credentials stay on Cloudflare Workers.
// This file is safe to publish. Add PARSE_API_KEY and CHORDROOM_ACCESS_CODE as Worker secrets.
const PROVIDER = 'https://api.parse.bot/scraper/12ac6f45-949a-4b24-ba4b-c6da49dbd41a';
const ORIGINS = new Set(['https://mlemson.github.io']);
const encoder = new TextEncoder();

function allowedOrigin(origin) {
  if (!origin) return '';
  if (ORIGINS.has(origin)) return origin;
  try {
    const url = new URL(origin);
    if (url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)) return origin;
  } catch {}
  return '';
}

function response(status, data, origin, extras = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
    ...extras
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'X-Chordroom-Code, Content-Type';
    headers['Access-Control-Max-Age'] = '600';
  }
  return new Response(JSON.stringify(data), {status, headers});
}

async function sameSecret(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || given.length > 256 || !expected) return false;
  const [a,b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(given)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected))
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function validChartUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      (url.hostname === 'ultimate-guitar.com' || url.hostname.endsWith('.ultimate-guitar.com')) &&
      url.pathname.startsWith('/tab/') &&
      !url.username && !url.password && value.length <= 600;
  } catch { return false; }
}

function parseError(result, status) {
  if (status === 401 || status === 403) return 'Ultimate Guitar-provider weigert de API-sleutel. Controleer het Parse-account.';
  if (status === 402) return 'API-tegoed is op. Controleer je Parse-credits.';
  if (status === 429) return 'De API-limiet is bereikt. Probeer het later opnieuw.';
  if (status >= 500) return 'De externe akkoordendienst is tijdelijk niet beschikbaar.';
  const error = result && (result.message || result.detail || result.error?.message || result.error);
  return typeof error === 'string' ? error.slice(0,200) : 'De externe akkoordendienst gaf een fout terug.';
}

async function callProvider(endpoint, params, env) {
  const url = new URL(PROVIDER + '/' + endpoint);
  for (const [key,value] of Object.entries(params)) url.searchParams.set(key, String(value));
  let result;
  try {
    const reply = await fetch(url, {
      method: 'GET',
      headers: {'X-API-Key': env.PARSE_API_KEY, 'Accept': 'application/json'},
      signal: AbortSignal.timeout(25000)
    });
    const raw = await reply.text();
    if (raw.length > 3200000) return {status: 502, error:'Antwoord van de bron is te groot.'};
    try { result = JSON.parse(raw); }
    catch { return {status:502, error:'Akkoordendienst gaf geen leesbare JSON terug.'}; }
    if (!reply.ok || result?.error || ['error','failed'].includes(result?.status)) {
      return {status: reply.ok ? 502 : reply.status, error:parseError(result, reply.status)};
    }
  } catch(e) {
    return {status:502, error:e?.name === 'TimeoutError' ? 'De akkoordendienst reageert niet op tijd.' : 'Netwerkfout bij ophalen van akkoorden.'};
  }
  const data = result?.data ?? result?.result?.data ?? result?.result ?? result;
  return {status:200, data};
}

export default {
  async fetch(request, env) {
    const originHeader = request.headers.get('Origin');
    const origin = allowedOrigin(originHeader);
    if (originHeader && !origin) return response(403, {error:'Herkomst van verzoek niet toegestaan.'}, '');
    if (request.method === 'OPTIONS') return response(204, {}, origin);
    if (request.method !== 'GET') return response(405, {error:'Alleen GET is mogelijk.'}, origin);
    const url = new URL(request.url);
    if (url.pathname === '/api/health' || url.pathname === '/api/config') {
      return response(200, {
        app:'Chordroom', mode:'cloudflare', apiConfigured: Boolean(env.PARSE_API_KEY),
        accessProtected: Boolean(env.CHORDROOM_ACCESS_CODE), version:'3.0'
      }, origin);
    }
    if (!['/api/search','/api/chart'].includes(url.pathname)) return response(404, {error:'Onbekend endpoint.'}, origin);
    if (!env.PARSE_API_KEY) return response(503, {error:'De Parse API-sleutel is nog niet ingesteld bij de online backend.'}, origin);
    if (!env.CHORDROOM_ACCESS_CODE || env.CHORDROOM_ACCESS_CODE.length < 8) {
      return response(503, {error:'Stel CHORDROOM_ACCESS_CODE in (minimaal 8 tekens) voordat de betaalde API publiek bereikbaar is.'}, origin);
    }
    if (!(await sameSecret(request.headers.get('X-Chordroom-Code'), env.CHORDROOM_ACCESS_CODE))) {
      return response(401, {error:'Toegangscode ontbreekt of is onjuist. Vul de persoonlijke Chordroom-code in.'}, origin);
    }
    if (url.pathname === '/api/search') {
      const query = (url.searchParams.get('q') || '').trim();
      const page = Number(url.searchParams.get('page') || 1);
      if (query.length < 2 || query.length > 120 || !Number.isInteger(page) || page < 1 || page > 10) {
        return response(400, {error:'Gebruik 2–120 tekens en paginanummer 1–10.'}, origin);
      }
      const upstream = await callProvider('search_songs', {query, tab_type:'chords',page}, env);
      if (upstream.error) return response(upstream.status, {error:upstream.error}, origin);
      const rows = upstream.data?.results;
      if (!Array.isArray(rows)) return response(502, {error:'De zoekresultaten hebben een onverwacht formaat.'}, origin);
      const results = rows.filter(r=>r && validChartUrl(r.url)).map(r=>({
        url:r.url, artist_name:String(r.artist_name||''), song_name:String(r.song_name||''),
        version:Number(r.version)||1, tonality:r.tonality||'', rating:Number(r.rating)||0,
        votes:Number(r.votes)||0, type:r.type||'Chords'
      }));
      results.sort((a,b) => {
        const quality = r => (String(r.type).toLowerCase()==='chords' ? 200 : 0) +
          Math.log10(1+r.votes)*25 + r.rating*8;
        return quality(b) - quality(a);
      });
      return response(200, {results,total_results:Number(upstream.data.total_results)||results.length,has_more:Boolean(upstream.data.has_more)}, origin);
    }
    const chartUrl = url.searchParams.get('url') || '';
    if (!validChartUrl(chartUrl)) return response(400, {error:'Gebruik een geldige Ultimate Guitar-link naar een tab.'}, origin);
    const upstream = await callProvider('get_chord_chart',{tab_url:chartUrl},env);
    if (upstream.error) return response(upstream.status,{error:upstream.error},origin);
    const data = upstream.data || {};
    const chart = data.chord_chart || data.raw_chart;
    if (typeof chart !== 'string' || !chart.trim()) return response(502,{error:'De bron gaf geen akkoordenschema voor dit nummer terug.'},origin);
    return response(200, {
      chart:chart.slice(0,200000), title:String(data.song_name||'').slice(0,180),
      artist:String(data.artist_name||'').slice(0,140), key:String(data.tonality||'').slice(0,30),
      capo:data.capo == null ? 0 : Number(data.capo)||0, url:chartUrl,
      raw_chart: typeof data.raw_chart === 'string' ? data.raw_chart.slice(0,200000) : ''
    }, origin);
  }
};
