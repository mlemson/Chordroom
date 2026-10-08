// Self-contained music theory, ChordPro import and transposition. No third-party dependencies.
window.ChordroomMusic = (() => {
  const SHARPS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLATS=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const PITCH={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  function pitch(note){const m=/^([A-G])([#b]?)$/.exec(note||'');return m ? (PITCH[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+12)%12:null;}
  function spelling(n,flats=false){return (flats?FLATS:SHARPS)[((n%12)+12)%12];}
  function parseChord(chord){
    const m=/^([A-G])([#b]?)([^/]*)?(?:\/([A-G][#b]?))?$/.exec((chord||'').trim());
    if(!m) return null;
    // Never mistake [Chorus], [Coming] or arbitrary page text for a chord.
    if(!/^(?:(?:maj|min|dim|aug|sus|add)|[mMø°Δ+\-0-9#b()])*$/.test(m[3]||'')) return null;
    return {root:m[1]+m[2],quality:m[3]||'',bass:m[4]||null,rootPc:pitch(m[1]+m[2])};
  }
  function notesForChord(chord){
    const c=parseChord(chord); if(!c) return null;
    const q=c.quality.replace(/\s/g,'');
    let intervals=/(?:dim|°|o)/i.test(q)?[0,3,6]:/(?:aug|\+)/i.test(q)?[0,4,8]:/^(?:m(?!aj)|min|-)/.test(q)?[0,3,7]:[0,4,7];
    if(/sus2/i.test(q))intervals=[0,2,7];else if(/sus4|sus(?!\d)/i.test(q))intervals=[0,5,7];else if(q==='5')intervals=[0,7];
    if(/m7b5|ø/.test(q)) intervals=[0,3,6,10];
    if(/b5/.test(q))intervals=intervals.map(i=>i===7?6:i);
    if(/#5/.test(q))intervals=intervals.map(i=>i===7?8:i);
    if(/maj7|M7|Δ7/.test(q)) intervals.push(11);
    else if(/dim7|°7/.test(q)) intervals.push(9);
    else if(/(?:7|9|11|13)/.test(q)) intervals.push(10);
    if(/(?:^|\D)6(?:\D|$)|13/.test(q))intervals.push(9);
    if(/add9|(?:^|[^a-z])9/.test(q))intervals.push(2);
    if(/11|add11/.test(q))intervals.push(5);
    if(/b9/.test(q))intervals.push(1);
    if(/#9/.test(q))intervals.push(3);
    if(/#11/.test(q))intervals.push(6);
    const pcs=[...new Set(intervals.map(i=>(c.rootPc+i)%12))];
    const preferFlat=c.root.includes('b');
    const noteNames=pcs.map(pc=>spelling(pc,preferFlat));
    return {...c,pcs,noteNames,bassName:c.bass||c.root,bassPc:pitch(c.bass||c.root)};
  }
  function transposeChord(name,n,preferFlats){
    const parsed=parseChord(name);if(!parsed)return name;
    const flat=preferFlats ?? (parsed.root.includes('b')||parsed.bass?.includes('b'));
    return spelling(parsed.rootPc+n,flat)+parsed.quality+(parsed.bass?'/'+spelling(pitch(parsed.bass)+n,flat):'');
  }
  function convertChart(text,steps=0,preferFlats=false){return (text||'').replace(/\[([^\]\r\n]+)\]/g,(whole,c)=>parseChord(c)?`[${transposeChord(c,steps,preferFlats)}]`:whole);}
  function normalizeRaw(text){return (text||'').replace(/\r\n?/g,'\n').replace(/\[tab\]/gi,'').replace(/\[\/tab\]/gi,'').replace(/\[ch\]([^\]]+?)\[\/ch\]/gi,'[$1]').replace(/\u00a0/g,' ');}
  function chordLine(line){
    const matches=[...line.matchAll(/\S+/g)];
    return matches.length>0&&matches.every(x=>Boolean(parseChord(x[0])))&&matches.some(x=>/^[A-G]/.test(x[0]));
  }
  function convertAboveLyrics(text){
    const rows=normalizeRaw(text).split('\n');let out=[];
    for(let i=0;i<rows.length;i++){
      const row=rows[i];
      if(chordLine(row)&&rows[i+1]!==undefined&&rows[i+1].trim()&&!chordLine(rows[i+1])&&!/^\s*\{/.test(rows[i+1])){
        const lyrics=rows[++i];const tokens=[...row.matchAll(/\S+/g)];
        let inserts=tokens.map(x=>({pos:x.index,chord:x[0]}));
        // The original spacing carries the chord positions. Insert from right to left.
        let rendered=lyrics;
        for(const item of inserts.reverse()){const p=Math.min(item.pos,rendered.length);rendered=rendered.slice(0,p)+`[${item.chord}]`+rendered.slice(p);}
        out.push(rendered);continue;
      }
      if(chordLine(row)) {out.push([...row.matchAll(/\S+/g)].map(x=>`[${x[0]}] `).join('').trimEnd());continue;}
      out.push(row);
    }
    return out.join('\n');
  }
  function metadata(text){const data={};for(const m of (text||'').matchAll(/^\s*\{(title|artist|key|capo|subtitle):\s*(.*?)\s*\}\s*$/gim))data[m[1].toLowerCase()]=m[2];return data;}
  function normalizeChart(text){
    const source=convertAboveLyrics(text);
    return source.split('\n').map(row=>{
      const section=/^\s*\[((?:pre-)?chorus|verse|bridge|intro|outro|solo|instrumental|interlude|refrain|ending)([^\]]*)\]\s*$/i.exec(row);
      return section ? `{comment: ${section[1]}${section[2]}}` : row;
    }).join('\n').trim();
  }
  function uniqueChords(text){return [...new Set([...normalizeRaw(text).matchAll(/\[([^\]\r\n]+)\]/g)].map(x=>x[1]).filter(x=>parseChord(x)))];}
  function voicing(chord,inversion=0){
    const spec=notesForChord(chord);if(!spec)return null;
    const base=60+spec.rootPc;
    const ordered=spec.pcs.map(pc=>base+(pc-spec.rootPc+12)%12).sort((a,b)=>a-b);
    const steps=Math.max(0,Math.min(ordered.length-1,Number(inversion)||0));
    for(let i=0;i<steps;i++)ordered.push(ordered.shift()+12);
    return {...spec,notes:ordered, noteNames:ordered.map(n=>spelling(n%12,spec.root.includes('b'))),inversion:steps};
  }
  function keyboardSVG(chord,selectedDisplay,inversion=0){
    const data=voicing(chord,inversion);
    const played=new Set(data?.notes||[]);
    const whites=[0,2,4,5,7,9,11]; const names=['C','D','E','F','G','A','B'];let rects='',blacks='';
    for(let i=0;i<14;i++){
      const pc=whites[i%7];const x=i*48;const midi=60+Math.floor(i/7)*12+pc;const active=played.has(midi);
      rects+=`<rect x="${x+0.6}" y="1" width="46.8" height="150" rx="3" fill="${active?'var(--highlight)':'var(--kbd-white)'}" stroke="var(--kbd-border)" stroke-width="1"/><text x="${x+24}" y="140" text-anchor="middle" font-size="12" fill="#5b676e">${names[i%7]}</text>`;
    }
    for(let i=0;i<14;i++){
      const pc=whites[i%7];if(![0,2,5,7,9].includes(pc))continue;
      const bpc=(pc+1)%12,x=i*48+35;const midi=60+Math.floor(i/7)*12+bpc;
      blacks+=`<rect x="${x}" y="1" width="27" height="92" rx="3" fill="${played.has(midi)?'var(--highlightblack)':'var(--kbd-black)'}" stroke="#26313b" stroke-width=".6"/>`;
    }
    return `<svg viewBox="0 0 672 154" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pianotoetsen bij akkoord ${escapeText(selectedDisplay||chord)}">${rects}${blacks}</svg>`;
  }
  function escapeText(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function demoSong(){return {id:'demo',title:'Avondlicht',artist:'Chordroom Demo',key:'C',capo:0,source:'demo',chart:`{title: Avondlicht}\n{artist: Chordroom Demo}\n{key: C}\n{comment: Couplet}\n[C]Langs een stille [Am]straat\n[F]Waar de avond [G]wacht\n\n{comment: Refrein}\n[F]Alles klinkt weer [C]nieuw\n[Dm7]Als je de muziek [G7]hoort`,created:Date.now()};}
  return {pitch,spelling,parseChord,notesForChord,voicing,transposeChord,convertChart,normalizeRaw,convertAboveLyrics,metadata,normalizeChart,uniqueChords,keyboardSVG,escapeText,demoSong};
})();
