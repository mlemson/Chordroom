(() => {
'use strict';
const M=window.ChordroomMusic;
const $=id=>document.getElementById(id);
const safe=M.escapeText;
const STORE='chordroom.local.songs.v1';const PREF='chordroom.local.pref.v1';
const loaded=(()=>{try{let arr=JSON.parse(localStorage.getItem(STORE));return Array.isArray(arr)?arr:[];}catch{return [];}})();
const settings=(()=>{try{return JSON.parse(localStorage.getItem(PREF))||{};}catch{return {};}})();
let songs=loaded, selectedId=null,transpose=0,instrument=settings.instrument==='guitar'?'guitar':'piano',chosenChord=null,mode=false, audioCtx, inversion=0, textSize=Number(settings.textSize)||14;
document.documentElement.dataset.theme=settings.theme==='light'?'light':'dark';
document.documentElement.style.setProperty('--lyrics-size', textSize+'px');
function remember(){try{localStorage.setItem(STORE,JSON.stringify(songs));}catch(err){toast('Opslaan is mislukt: browseropslag vol of geblokkeerd. Exporteer het nummer als .cho.');}}
function savePref(){try{localStorage.setItem(PREF,JSON.stringify({instrument,theme:document.documentElement.dataset.theme||'dark',textSize}));}catch{}}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('visible');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('visible'),4500);}
function id(){return globalThis.crypto?.randomUUID?.()||`cr-${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function current(){return songs.find(s=>s.id===selectedId);}
function displayChord(c){const s=current();if(!s)return c;return M.transposeChord(c,transpose+(instrument==='piano'?Number(s.capo)||0:0));}
function selectedConcertChord(c){const s=current();return M.transposeChord(c,transpose+(Number(s?.capo)||0));}
function displayKey(s){const c=s.key && M.parseChord(s.key);return c?M.transposeChord(s.key,transpose+(instrument==='piano'?Number(s.capo)||0:0)):s.key||'—';}
function showWelcome(){selectedId=null;$('welcome').classList.remove('hidden');$('workspace').classList.add('hidden');$('crumb-title').textContent='Welkom';renderLibrary();}
function openSong(songId){$('mobile-library-toggle').setAttribute('aria-expanded','false');document.querySelector('.sidebar').classList.remove('mobile-open');const s=songs.find(x=>x.id===songId);if(!s)return;selectedId=s.id;transpose=0;inversion=0;chosenChord=M.uniqueChords(s.chart)[0]||'C';$('welcome').classList.add('hidden');$('workspace').classList.remove('hidden');$('crumb-title').textContent=s.title;renderWorkspace();renderLibrary();}
function renderLibrary(){const el=$('song-list');el.textContent='';$('library-count').textContent=songs.length;const filter=$('library-filter').value.toLowerCase().trim();const found=songs.filter(s=>`${s.title} ${s.artist}`.toLowerCase().includes(filter));if(!found.length){el.innerHTML='<p class="empty-library">Nog geen nummers gevonden.</p>';return;}for(const s of found){const btn=document.createElement('button');btn.className='song-row'+(s.id===selectedId?' active':'');const icon=document.createElement('span');icon.className='note-circle';icon.textContent='♪';const label=document.createElement('span');const b=document.createElement('strong');b.textContent=s.title;const small=document.createElement('small');small.textContent=s.artist||'Onbekende artiest';label.append(b,small);btn.append(icon,label);btn.addEventListener('click',()=>openSong(s.id));el.append(btn);}}
function renderWorkspace(){const s=current();if(!s)return;$('song-title').textContent=s.title;$('song-artist').textContent=s.artist||'Onbekende artiest';$('song-origin').textContent=({api:'ULTIMATE GUITAR · GEÏMPORTEERD',manual:'ZELF GEÏMPORTEERD',demo:'VOORBEELD'})[s.source]||'MIJN BIBLIOTHEEK';$('capo-number').value=s.capo||0;$('transpose-number').textContent=transpose>0?'+'+transpose:String(transpose);document.querySelectorAll('[data-instrument]').forEach(x=>x.classList.toggle('selected',x.dataset.instrument===instrument));$('sheet-meta').textContent=`Toonsoort ${displayKey(s)} · ${instrument==='piano'?'klinkend':'gitaarvormen'}`;renderSheet();renderPiano();}
function renderSheet(){const s=current();if(!s)return;const out=$('sheet-content');out.textContent='';let rows=M.normalizeChart(s.chart).split('\n');let hadChords=false;for(const line of rows){
  const directive=/^\s*\{([a-z_]+):?\s*([^}]*)\}\s*$/i.exec(line);
  if(directive){const type=directive[1].toLowerCase();if(['title','artist','subtitle','key','capo','tempo','time','duration','tuning','composer','album'].includes(type))continue;if(type==='comment'||type.startsWith('start_of_')){const h=document.createElement('h3');h.className='section-label';const label=directive[2]?.match(/label\s*=\s*["']([^"']+)["']/)?.[1];h.textContent=label||((directive[2]||type.replace(/start_of_/,'').replace(/_/g,' ')).trim());out.append(h);}continue;}
  const header=/^\[(Verse|Chorus|Intro|Bridge|Outro|Pre-Chorus|Solo|Interlude|Refrain|Ending)[^\]]*\]$/i.exec(line.trim());
  if(header){const h=document.createElement('h3');h.className='section-label';h.textContent=line.trim().slice(1,-1);out.append(h);continue;}
  const p=document.createElement('p');p.className='lyric-line';if(!line.trim()){p.textContent=' ';out.append(p);continue;}
  const matches=[...line.matchAll(/\[([^\]\n]+)\]/g)];let last=0;
  for(let i=0;i<matches.length;i++){
    const match=matches[i];if(!M.parseChord(match[1]))continue;
    hadChords=true;
    p.append(document.createTextNode(line.slice(last,match.index)));
    const chord=match[1];const next=matches[i+1];
    let segment=line.slice(match.index+match[0].length,next?next.index:line.length);
    if(!segment)segment='  ';
    const wrapper=document.createElement('span');wrapper.className='chord-fragment';
    const button=document.createElement('button');button.textContent=displayChord(chord);button.title='Toon op piano: '+selectedConcertChord(chord);button.className=chord===chosenChord?'active-chord':'';button.addEventListener('click',()=>{chosenChord=chord;renderPiano();renderSheet();});
    const words=document.createElement('span');words.textContent=segment;wrapper.append(button,words);p.append(wrapper);
    last=next?next.index:line.length;
  }
  p.append(document.createTextNode(line.slice(last)));out.append(p);
}
if(!hadChords){const p=document.createElement('p');p.className='no-chart';p.textContent='Geen akkoordmarkeringen herkend. Probeer ChordPro, bijvoorbeeld [C]tekst [G]tekst, of bewerk het nummer.';out.prepend(p);}
}
function renderPiano(){const s=current();if(!s)return;const used=M.uniqueChords(s.chart);if(!chosenChord||!M.parseChord(chosenChord))chosenChord=used[0]||'C';const concert=selectedConcertChord(chosenChord);const spec=M.notesForChord(concert);$('selected-chord').textContent=instrument==='piano'?concert:displayChord(chosenChord);const voiced=M.voicing(concert,inversion);inversion=voiced?.inversion||0;$('piano-keyboard').innerHTML=M.keyboardSVG(concert,concert,inversion);$('right-notes').textContent=voiced?voiced.noteNames.join(' · '):'Onbekend akkoord';const inversions=$('inversion-choices');inversions.textContent='';for(let i=0;i<Math.min(4,spec?.pcs.length||0);i++){const b=document.createElement('button');b.className=i===inversion?'active':'';b.textContent=i===0?'Grondligging':`${i}e omkering`;b.onclick=()=>{inversion=i;renderPiano();};inversions.append(b);} $('left-notes').textContent=spec?spec.bassName:'—';const choices=$('chord-choices');choices.textContent='';for(const c of used){const b=document.createElement('button');b.textContent=displayChord(c);b.className=c===chosenChord?'active':'';b.addEventListener('click',()=>{chosenChord=c;renderPiano();renderSheet();});choices.append(b);}if(!used.length)choices.textContent='Nog geen akkoorden.';
const capo=Number(s.capo)||0;const tip=$('capo-tip');if(capo&&instrument==='piano'){tip.classList.remove('hidden');tip.textContent=`Capo op gitaar: ${capo}. Op piano zie en hoor je de klinkende akkoorden, ${capo} halve tonen hoger dan de gitaarvormen.`;}else if(capo&&instrument==='guitar'){tip.classList.remove('hidden');tip.textContent=`Gitaarvormen met capo ${capo}. Bij afspelen klinkt het akkoord ${capo} halve tonen hoger.`;}else tip.classList.add('hidden');}
function play(){let spec=M.notesForChord(selectedConcertChord(chosenChord));if(!spec){toast('Kan dit akkoord nog niet herkennen.');return;}try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const now=audioCtx.currentTime;const voiced=M.voicing(selectedConcertChord(chosenChord),inversion);const mids=[48+spec.bassPc,...voiced.notes];for(const [idx,midi] of mids.entries()){const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(idx===0?.1:.08,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+1.65);osc.connect(gain).connect(audioCtx.destination);osc.start(now);osc.stop(now+1.7);}}catch(e){toast('Geluid kon niet worden afgespeeld: '+e.message);}}
function songFromInput({title,artist,key,capo,chart,source='manual',url=''}){if(!chart.trim())throw new Error('Vul eerst een akkoordenschema in.');const meta=M.metadata(chart);const cleaned=M.normalizeChart(chart);return {id:id(),title:(title||meta.title||'Naamloos nummer').trim().slice(0,180),artist:(artist||meta.artist||'').trim().slice(0,140),key:(key||meta.key||'').trim().slice(0,20),capo:Math.max(0,Math.min(12,Number(capo !== '' && capo != null ? capo : meta.capo)||0)),chart:cleaned,source,url,created:Date.now()};}
function addSong(song){songs.unshift(song);remember();$('dialog').close();openSong(song.id);toast(`‘${song.title}’ staat nu in je bibliotheek.`);}
function dialogBody(title,description,content){$('dialog-body').innerHTML=`<h2>${safe(title)}</h2><p>${safe(description)}</p>${content}`;$('dialog').showModal();}
function importDialog(edit=false){const s=edit?current():null;dialogBody(edit?'Nummer bewerken':'Akkoordenschema importeren',edit?'Pas de gegevens en het akkoordenschema aan.':'Plak ChordPro, tekst uit Ultimate Guitar of een schema met akkoorden boven de woorden.',`<div class="two-cols"><div><label for="edit-title">Titel</label><input id="edit-title" placeholder="Bijv. Yellow" value="${safe(s?.title||'')}"></div><div><label for="edit-artist">Artiest</label><input id="edit-artist" placeholder="Bijv. Coldplay" value="${safe(s?.artist||'')}"></div><div><label for="edit-key">Toonsoort (optioneel)</label><input id="edit-key" placeholder="C, F#m, Bb" value="${safe(s?.key||'')}"></div><div><label for="edit-capo">Capo op gitaar</label><input id="edit-capo" type="number" min="0" max="12" value="${safe(s?.capo??'')}"></div></div><label for="edit-chart">Akkoordenschema</label><textarea id="edit-chart" spellcheck="false" placeholder="{title: Voorbeeld}\n{artist: Artiest}\n[C]Eerste zin met [G]akkoorden\n[Am]Tweede regel [F]hier"></textarea><div class="dialog-actions"><button class="primary" type="button" id="confirm-import">${edit?'Wijzigingen bewaren':'In bibliotheek zetten'}</button><button class="outline" type="button" id="upload-file">.cho / .txt openen</button><input type="file" id="file-input" accept=".cho,.chopro,.pro,.txt,.crd" hidden><a target="_blank" rel="noopener noreferrer" href="https://fretlist.com/tools/ultimate-guitar-to-chordpro">Fretlist-converter ↗</a></div><p class="help">Tip: op Ultimate Guitar kun je Ctrl+A → Ctrl+C gebruiken en de tekst plakken. De schoonmaak van volledige pagina's is experimenteel. Bij een rommelige import werkt de Fretlist-converter vaak beter.</p><div id="dialog-error" class="error hidden"></div>`);
$('edit-chart').value=s?.chart||'';$('upload-file').onclick=()=>$('file-input').click();$('file-input').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>250000){errorBox('Bestand is te groot (maximum 250 kB).');return;}const raw=await file.text();$('edit-chart').value=raw;if(!$('edit-title').value){$('edit-title').value=file.name.replace(/\.(cho|chopro|pro|txt|crd)$/i,'');}const meta=M.metadata(raw);if(meta.title)$('edit-title').value=meta.title;if(meta.artist)$('edit-artist').value=meta.artist;if(meta.key)$('edit-key').value=meta.key;if(meta.capo)$('edit-capo').value=meta.capo;};
$('confirm-import').onclick=()=>{try{const input={title:$('edit-title').value,artist:$('edit-artist').value,key:$('edit-key').value,capo:$('edit-capo').value,chart:$('edit-chart').value};const song=songFromInput(input);if(s){Object.assign(s,{...song,id:s.id,source:s.source,created:s.created,url:s.url});remember();$('dialog').close();renderWorkspace();renderLibrary();toast('Nummer bijgewerkt.');}else addSong(song);}catch(e){errorBox(e.message);}};}
function errorBox(msg){const b=$('dialog-error');b.textContent=msg;b.classList.remove('hidden');}
// The public GitHub Pages build injects a Worker URL into api-config.js.
// Never put PARSE_API_KEY or the access code in a public file.
function isLocalServer(){return location.protocol!=='file:' && ['127.0.0.1','localhost'].includes(location.hostname);}
function cloudEndpoint(){
  const value=String(window.CHORDROOM_API_BASE||'').trim().replace(/\/+$/,'');
  try { const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password ? u.origin : ''; }
  catch {return '';}
}
function hasOnlineSearch(){return isLocalServer()||Boolean(cloudEndpoint());}
function accessCode(){try{return sessionStorage.getItem('chordroom.access.v1')||'';}catch{return '';}}
function storeAccessCode(code){try{if(code)sessionStorage.setItem('chordroom.access.v1',code);}catch{}}
let previousQuery='';
function searchDialog(){
  const cloud=!isLocalServer(), available=hasOnlineSearch();
  const info=available
    ? 'Zoek op artiest of titel. Het beste beschikbare akkoordenschema wordt automatisch in je bibliotheek geladen. Andere versies kun je ook kiezen.'
    : 'Automatisch zoeken is nog niet verbonden. De website werkt al, maar de Cloudflare-koppeling moet één keer worden ingesteld.';
  const instructions=available ? '' :
    '<p class="api-setup-warning">De online zoekserver is nog niet ingericht. '+
    '<a href="https://github.com/mlemson/Chordroom/blob/main/README.md#automatisch-online-akkoorden-zoeken" target="_blank" rel="noopener noreferrer">Bekijk de activatiestappen op GitHub</a>.</p>';
  const field=cloud&&available ? '<div class="api-code-wrap"><label for="access-code">Persoonlijke toegangscode</label>'+
    '<input id="access-code" type="password" autocomplete="off" placeholder="Je Chordroom-toegangscode" aria-describedby="code-help">'+
    '<p class="help" id="code-help">Alleen nodig voor je privézoekserver. De code wordt voor deze browsersessie onthouden, niet gepubliceerd op GitHub.</p></div>' : '';
  dialogBody('Vind je akkoorden automatisch',info,
    instructions+'<form id="search-form" class="search-form">'+
    '<label for="search-input">Artiest, titel of Ultimate Guitar-link</label>'+
    '<div class="search-entry"><input id="search-input" placeholder="Bijvoorbeeld Coldplay Yellow" minlength="2" required>'+
    '<button id="search-button" class="primary" type="submit">Zoeken en openen</button></div>'+
    field+'<label class="auto-choice"><input type="checkbox" id="auto-first" checked> Beste akkoordenversie direct openen</label>'+
    '</form><div id="dialog-error" class="error hidden" role="alert"></div>'+
    '<div id="search-results" class="search-results" aria-live="polite"></div>'+
    '<p class="help">Zoektip: plak een volledige Ultimate Guitar-link om dat specifieke arrangement meteen te openen. '+
    'Er kunnen verschillen zijn tussen arrangementen. Controleer zo nodig de capo en toonsoort.</p>'+
    '<div class="dialog-actions"><button class="outline" id="alternative-import" type="button">Zelf akkoorden importeren</button></div>'
  );
  $('search-input').value=previousQuery;
  if($('access-code'))$('access-code').value=accessCode();
  $('alternative-import').onclick=()=>importDialog();
  $('search-form').onsubmit=async e=>{
    e.preventDefault();
    const query=$('search-input').value.trim();
    if(query.length<2)return;
    previousQuery=query;
    const btn=$('search-button');
    btn.disabled=true;btn.textContent='Akkoorden ophalen…';
    $('dialog-error').classList.add('hidden');
    $('search-results').textContent='';
    try{
      if(!available)throw new Error('Automatisch zoeken is nog niet geactiveerd. Volg de GitHub-activatiestappen om de online zoekserver te koppelen.');
      if(isUltimateGuitarUrl(query)){
        await retrieveChart(query,null);
      }else{
        const r=await api('/api/search?q='+encodeURIComponent(query));
        const results=r.results||[];
        if(!results.length){renderResults([]);return;}
        renderResults(results);
        if($('auto-first').checked){
          const first=results.find(x=>String(x.type).toLowerCase()==='chords')||results[0];
          await retrieveChart(first.url,first);
        }
      }
    }catch(err){errorBox(err.message);}
    finally{btn.disabled=false;btn.textContent='Zoeken en openen';}
  };
}
function isUltimateGuitarUrl(value){
  try{const u=new URL(value);return u.protocol==='https:'&&
    (u.hostname==='ultimate-guitar.com'||u.hostname.endsWith('.ultimate-guitar.com'))&&
    u.pathname.startsWith('/tab/');}catch{return false;}
}
async function api(path){
  if(!hasOnlineSearch())throw new Error('De online zoekserver is nog niet ingesteld.');
  const cloud=!isLocalServer();
  const code=cloud?($('access-code')?.value?.trim()||accessCode()):'';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),32000);
  let response,body;
  try{
    response=await fetch((cloud?cloudEndpoint():'')+path,{
      headers:{'Accept':'application/json',...(cloud&&code?{'X-Chordroom-Code':code}:{})},
      signal:controller.signal
    });
    try{body=await response.json();}catch{throw new Error('De zoekserver gaf geen geldig JSON-antwoord (HTTP '+response.status+').');}
  }catch(err){
    throw new Error(err.name==='AbortError'?'De akkoordendienst reageert niet binnen 32 seconden.':err.message||'Verbinding met de zoekserver mislukt.');
  }finally{clearTimeout(timeout);}
  if(!response.ok){
    if(response.status===401)throw new Error('Je persoonlijke toegangscode ontbreekt of is onjuist. Controleer het codeveld.');
    throw new Error(body?.error||('Zoekserverfout ('+response.status+').'));
  }
  if(cloud&&code)storeAccessCode(code);
  return body;
}
async function retrieveChart(url,metadata){
  if(!isUltimateGuitarUrl(url))throw new Error('Dit is geen ondersteunde Ultimate Guitar-akkoordenlink.');
  const existing=songs.find(s=>s.url===url);
  if(existing){$('dialog').close();openSong(existing.id);toast('Dit nummer stond al in je bibliotheek.');return;}
  const result=await api('/api/chart?url='+encodeURIComponent(url));
  const song=songFromInput({
    title:metadata?.song_name||result.title||'Onbekend nummer',
    artist:metadata?.artist_name||result.artist||'',
    key:result.key||metadata?.tonality||'',
    capo:result.capo,chart:result.chart,source:'api',url
  });
  if(!M.uniqueChords(song.chart).length)throw new Error('Het nummer is opgehaald, maar er werden geen herkenbare akkoorden gevonden. Kies een andere versie.');
  addSong(song);
}
function renderResults(rows){
  const box=$('search-results');
  box.textContent='';
  if(!rows.length){box.textContent='Geen resultaten gevonden. Probeer een andere zoekterm.';return;}
  const label=document.createElement('p');
  label.className='result-label';
  label.textContent='Gevonden arrangementen · kies eventueel een andere versie';
  box.append(label);
  for(const row of rows.slice(0,30)){
    const item=document.createElement('div');item.className='search-result';
    const meta=document.createElement('div');
    const title=document.createElement('b');title.textContent=row.song_name||'Onbekend nummer';
    const subtitle=document.createElement('span');
    subtitle.textContent=(row.artist_name||'Onbekend')+' · versie '+(row.version||1)+' · '+(row.type||'Chords')+
      (row.rating?' · ★ '+Number(row.rating).toFixed(1):'')+(row.votes?' ('+row.votes+' stemmen)':'');
    meta.append(title,subtitle);
    const button=document.createElement('button');
    button.textContent='Open akkoorden';button.className='outline small';
    button.onclick=async()=>{
      button.disabled=true;button.textContent='Ophalen…';
      $('dialog-error').classList.add('hidden');
      try{await retrieveChart(row.url,row);}
      catch(err){errorBox(err.message);button.disabled=false;button.textContent='Opnieuw';}
    };
    item.append(meta,button);box.append(item);
  }
}
function exportChordpro(){const s=current();if(!s)return;const text=M.normalizeChart(s.chart);const base=text.replace(/^\s*\{(?:title|artist|key|capo):[^}]*\}\s*\n?/gim,'').trim();const header=[`{title: ${s.title}}`,s.artist?`{artist: ${s.artist}}`:'',s.key?`{key: ${s.key}}`:'',s.capo?`{capo: ${s.capo}}`:''].filter(Boolean).join('\n');const file=header+'\n\n'+base+'\n';const blob=new Blob([file],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(s.artist+' - '+s.title).replace(/[\\/:*?"<>|]/g,'').trim()+'.cho';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function changeTranspose(delta){transpose=Math.max(-12,Math.min(12,transpose+delta));renderWorkspace();}
function keyboard(e){if(e.key==='Escape'&&mode){setPerformance(false);return;}if($('dialog').open||!current()||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowUp'){e.preventDefault();changeTranspose(1);}if(e.key==='ArrowDown'){e.preventDefault();changeTranspose(-1);}if(e.key===' '){e.preventDefault();play();}}
function setPerformance(value){mode=value;document.body.classList.toggle('performance',mode);$('performance-mode').textContent=mode?'← Normale weergave':'↗ Speelmodus';}
$('mobile-library-toggle').onclick=()=>{const aside=document.querySelector('.sidebar');const open=aside.classList.toggle('mobile-open');$('mobile-library-toggle').setAttribute('aria-expanded',String(open));};
$('new-song').onclick=()=>importDialog();$('open-import').onclick=()=>importDialog();$('open-search').onclick=searchDialog;$('welcome-search').onclick=searchDialog;$('welcome-import').onclick=()=>importDialog();$('library-filter').oninput=renderLibrary;$('edit-song').onclick=()=>importDialog(true);$('save-song').onclick=exportChordpro;
$('delete-song').onclick=()=>{const s=current();if(!s)return;if(!confirm(`‘${s.title}’ uit je lokale bibliotheek verwijderen?`))return;songs=songs.filter(x=>x.id!==s.id);remember();showWelcome();toast('Nummer verwijderd.');};
$('transpose-down').onclick=()=>changeTranspose(-1);$('transpose-up').onclick=()=>changeTranspose(1);
$('capo-number').onchange=e=>{const s=current();if(!s)return;s.capo=Math.max(0,Math.min(12,Number(e.target.value)||0));remember();renderWorkspace();};
document.querySelectorAll('[data-instrument]').forEach(b=>b.onclick=()=>{instrument=b.dataset.instrument;savePref();renderWorkspace();});$('play-chord').onclick=play;$('performance-mode').onclick=()=>setPerformance(!mode);
$('text-smaller').onclick=()=>{textSize=Math.max(11,textSize-1);document.documentElement.style.setProperty('--lyrics-size',textSize+'px');savePref();};$('text-larger').onclick=()=>{textSize=Math.min(22,textSize+1);document.documentElement.style.setProperty('--lyrics-size',textSize+'px');savePref();};
$('backup-library').onclick=()=>{const blob=new Blob([JSON.stringify({format:'chordroom-library',version:2,songs},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const link=document.createElement('a');link.href=u;link.download='chordroom-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
$('theme-toggle').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';savePref();};document.addEventListener('keydown',keyboard);
if(hasOnlineSearch()){
  fetch((isLocalServer()?'':cloudEndpoint())+'/api/config')
    .then(r=>r.json()).then(v=>{
      $('api-status').textContent=v.app==='Chordroom'&&v.apiConfigured?'Zoeken online beschikbaar':'Zoekserver nog niet ingesteld';
    }).catch(()=>{$('api-status').textContent='Zoekserver tijdelijk offline';});
}else $('api-status').textContent='Automatisch zoeken: nog instellen';
if(!songs.length){songs=[M.demoSong()];remember();}renderLibrary();showWelcome();
})();
