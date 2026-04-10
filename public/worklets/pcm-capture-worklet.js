/**
 * AudioWorklet processor: captures mic audio, downsamples to 16 kHz linear16 (Int16).
 *
 * Streaming linear interpolation with carry + last-sample bridging across 128-frame
 * quanta (avoids zero-padding past buffer end, which caused clicks/distortion).
 */

class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._targetRate = 16000;
    this._ratio = sampleRate / this._targetRate;
    this._chunkSize = Math.round(this._targetRate * 0.08);
    /** Fractional read position; may be negative (bridges from previous block's last sample). */
    this._carry = 0;
    this._lastSample = 0;
    /** Batch to ~80ms chunks for steadier voice-agent streaming. */
    this._pending = [];
  }

  /**
   * @param {Float32Array[][]} inputs
   * @param {Float32Array[][]} outputs
   * @returns {boolean}
   */
  process(inputs, outputs) {
    const outCh = outputs[0];
    if (outCh) {
      for (let c = 0; c < outCh.length; c++) {
        outCh[c].fill(0);
      }
    }

    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const samples = input[0];
    const ratio = this._ratio;
    const pcm = [];

    let srcIdx = this._carry;

    while (true) {
      const idx = Math.floor(srcIdx);
      if (idx + 1 >= samples.length) break;
      const frac = srcIdx - idx;
      const s0 = idx >= 0 ? samples[idx] : this._lastSample;
      const s1 = samples[idx + 1];
      const val = s0 + frac * (s1 - s0);
      pcm.push(Math.max(-32768, Math.min(32767, Math.round(val * 32767))));
      srcIdx += ratio;
    }

    this._carry = srcIdx - samples.length;
    this._lastSample = samples[samples.length - 1];

    if (pcm.length > 0) {
      this._pending.push(...pcm);
    }

    while (this._pending.length >= this._chunkSize) {
      const chunk = this._pending.splice(0, this._chunkSize);
      const out = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) out[i] = chunk[i];
      this.port.postMessage(out.buffer, [out.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm-capture", PcmCaptureProcessor);
