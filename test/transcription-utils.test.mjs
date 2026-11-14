import test from 'node:test';
import assert from 'node:assert/strict';
import { toRollNotes, analyzeSeconds } from '../src/transcription-utils.mjs';

test('converts predicted pitch, onset and duration to piano roll format', () => {
  const actual = toRollNotes([
    {pitchMidi: 64, startTimeSeconds: 0.5, durationSeconds: 0.4, amplitude: 0.8},
    {pitchMidi: 60, startTimeSeconds: -0.04, durationSeconds: 0.3, amplitude: 0.4},
  ]);
  assert.deepEqual(actual.map(n=>n.note), [60,64]);
  assert.equal(actual[0].start,0);
  assert.equal(actual[1].end,0.9);
  assert.equal(actual[1].confidence,0.8);
});

test('rejects corrupt or too short predictions, supports piano pitches A0-C8',()=>{
 const result=toRollNotes([
 {pitchMidi:21,startTimeSeconds:0,durationSeconds:.2},
 {pitchMidi:108,startTimeSeconds:1,durationSeconds:.1},
 {pitchMidi:109,startTimeSeconds:2,durationSeconds:.2},
 {pitchMidi:64,startTimeSeconds:2,durationSeconds:.01},
 {pitchMidi:64,startTimeSeconds:NaN,durationSeconds:1},
 ]);
 assert.deepEqual(result.map(n=>n.note),[21,108]);
});

test('limits processing to requested section and browser safety maximum',()=>{
 assert.equal(analyzeSeconds(40,60),40);
 assert.equal(analyzeSeconds(250,300),180);
 assert.equal(analyzeSeconds(85,30),30);
 assert.throws(()=>analyzeSeconds(0,30));
});
