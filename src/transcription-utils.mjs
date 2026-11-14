/**
 * Map Basic Pitch's inferred note events onto Chordroom's piano-roll model.
 * Pure functions to make audio-to-roll behavior testable without the AI runtime.
 */
export function toRollNotes(events) {
  if (!Array.isArray(events)) throw new TypeError('Expected an array of note events');
  return events
    .filter(event => event && Number.isFinite(event.pitchMidi) &&
      Number.isFinite(event.startTimeSeconds) &&
      Number.isFinite(event.durationSeconds) &&
      event.durationSeconds > 0 &&
      event.pitchMidi >= 21 && event.pitchMidi <= 108)
    .map(event => ({
      note: Math.round(event.pitchMidi),
      start: Math.max(0, event.startTimeSeconds),
      end: Math.max(0, event.startTimeSeconds) + event.durationSeconds,
      confidence: Number.isFinite(event.amplitude) ? Math.max(0, Math.min(1, event.amplitude)) : null,
      track: 0,
    }))
    .filter(event => event.end - event.start >= 0.065)
    .sort((a, b) => a.start - b.start || a.note - b.note);
}

export function analyzeSeconds(audioDuration, requestedSeconds, maxSeconds = 180) {
  if (!Number.isFinite(audioDuration) || audioDuration <= 0) throw new Error('Audio heeft geen geldige lengte');
  if (!Number.isFinite(requestedSeconds) || requestedSeconds <= 0) throw new Error('Ongeldige analyselengte');
  return Math.min(audioDuration, requestedSeconds, maxSeconds);
}
