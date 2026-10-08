import {parseCall} from './server.mjs';
console.log('\nCHORDROOM - API DIAGNOSE (onofficiele Parse-koppeling)');
console.log('Node.js:', process.version);
console.log('API-sleutel aanwezig:',process.env.PARSE_API_KEY ? 'ja' : 'nee');
if (!process.env.PARSE_API_KEY) {
  console.log('\nGEEN API-SLEUTEL: open .env naast server.mjs en zet PARSE_API_KEY=jouw_sleutel');
  console.log('Met handmatige import via Fretlist/ChordPro kun je Chordroom wel gebruiken.');
  process.exit(2);
}
console.log('Let op: de volgende opdrachten kunnen Parse-credits gebruiken.\n');
const search=await parseCall('search_songs',{query:'coldplay yellow',tab_type:'chords',page:1});
if (!search.ok) {console.log('ZOEKEN MISLUKT, status',search.status,'\n',search.error);process.exit(1);}
if (!Array.isArray(search.data?.results)) {console.log('ZOEKEN: responsformaat is veranderd. Velden:', Object.keys(search.data||{}).join(', '));process.exit(1);}
console.log('ZOEKEN GELUKT:',search.data.results.length,'resultaten op deze pagina.');
const first=search.data.results.find(item=>String(item.url||'').startsWith('https://tabs.ultimate-guitar.com/tab/'));
if (!first) {console.log('Geen publieke akkoordentab gevonden. Test een andere titel.');process.exit(1);}
console.log('Gekozen:', first.artist_name, '-', first.song_name);
const chart=await parseCall('get_chord_chart',{tab_url:first.url});
if (!chart.ok) {console.log('OPHALEN MISLUKT, status',chart.status,'\n',chart.error);process.exit(1);}
const value=chart.data?.chord_chart||chart.data?.raw_chart;
if (typeof value!=='string'||!value.trim()) {console.log('OPHALEN: responsformaat is veranderd. Velden:',Object.keys(chart.data||{}).join(', '));process.exit(1);}
console.log('OPHALEN GELUKT:',value.length,'tekens akkoordenschema;',Array.isArray(chart.data.chords_used)?chart.data.chords_used.length:'onbekend','verschillende akkoorden.');
console.log('\nBEIDE ENDPOINTS WERKEN MET JOUW SLEUTEL.');
