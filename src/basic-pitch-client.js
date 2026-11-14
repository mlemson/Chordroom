/*
 * On-demand, browser-only Basic Pitch transcription adapter.
 * Spotify Basic Pitch source and model © Spotify AB, Apache-2.0.
 * All submitted audio is processed in the user's browser. No upload endpoint.
 */
import { BasicPitch, outputToNotesPoly, noteFramesToTime } from '@spotify/basic-pitch';
import { toRollNotes } from './transcription-utils.mjs';

let loadedModel = null;
let loadedUrl = null;

/**
 * @param {AudioBuffer} monoBuffer 22050 Hz and mono AudioBuffer, resampled by caller.
 * @param {string} modelUrl local site-relative model.json URL
 * @param {(stage: string, progress: number) => void} onProgress
 */
export async function transcribeAudioBuffer(monoBuffer, modelUrl, onProgress = () => {}) {
  if (monoBuffer.sampleRate !== 22050 || monoBuffer.numberOfChannels !== 1) {
    throw new Error('Basic Pitch vereist mono-audio op 22050 Hz');
  }
  if (!loadedModel || loadedUrl !== modelUrl) {
    loadedUrl = modelUrl;
    loadedModel = new BasicPitch(modelUrl);
  }
  onProgress('AI-model laden', 0);
  await loadedModel.model;
  const frames = [];
  const onsets = [];
  onProgress('Noten herkennen', 0);
  await loadedModel.evaluateModel(
    monoBuffer,
    (f, o) => { frames.push(...f); onsets.push(...o); },
    p => onProgress('Noten herkennen', Math.min(1, Math.max(0, p))),
  );
  if (!frames.length) return [];
  onProgress('Noten verwerken', 0.96);
  const raw = outputToNotesPoly(frames, onsets, 0.32, 0.25, 5);
  const notes = toRollNotes(noteFramesToTime(raw));
  onProgress('Gereed', 1);
  return notes;
}
