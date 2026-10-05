"""Latency bench for a Deepgram Voice Agent alternative: Anthropic (think) + Chatterbox Turbo (speak).

Measures the two legs that replace Deepgram's think+speak:
  1. LLM: time to first token, and time to the first complete sentence (what TTS can start on).
  2. TTS: time to synthesize that first sentence (= time to first audio, since Turbo isn't streaming).
Perceived turn latency ~= STT endpointing (unchanged, Deepgram Flux) + (2) first-sentence + (3) TTS.

Setup: uv venv -p 3.11 && uv pip install chatterbox-tts anthropic "setuptools<81"
       (setuptools pin: the watermarker needs pkg_resources, else it silently loads as None)
Run:  python bench.py [--device mps|cuda|cpu] [--runs 5]
LLM leg runs only when ANTHROPIC_API_KEY is set.
"""
import argparse, os, re, statistics, time

import torch

# Typical interviewer turns (~1-3 sentences, what the room actually speaks).
REPLIES = [
    "Nice, that's a solid start. What's the time complexity of your approach?",
    "Okay, walk me through what happens when the input array is empty.",
    "Good. Can you think of a way to do this in a single pass, without the extra hash map?",
    "Let's move on to coding. Go ahead and implement it, and talk me through it as you go.",
    "Hmm, I think there's an off-by-one in your loop bound. Want to trace it with a small example?",
]
SYSTEM = (
    "You are Tia, a friendly senior engineer running a live voice DSA mock interview. "
    "Speak naturally in 1-3 short sentences. No markdown."
)
USER = "I'd use a hash map to store each number's index, then for each element check if target minus it is already in the map."


def pct(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(p / 100 * (len(xs) - 1))))]


def summary(name, xs):
    print(f"  {name:<28} p50 {pct(xs, 50):7.0f} ms   p90 {pct(xs, 90):7.0f} ms   (n={len(xs)})")


def bench_llm(model, runs):
    import anthropic

    client = anthropic.Anthropic()
    ttft, first_sentence, in_tok, out_tok = [], [], [], []
    for _ in range(runs):
        t0 = time.perf_counter()
        buf, t_first, t_sent = "", None, None
        with client.messages.stream(
            model=model,
            max_tokens=300,
            system=[{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": USER}],
        ) as stream:
            for text in stream.text_stream:
                now = time.perf_counter()
                t_first = t_first or now
                buf += text
                if t_sent is None and re.search(r"[.!?](\s|$)", buf):
                    t_sent = now
            usage = stream.get_final_message().usage
        ttft.append((t_first - t0) * 1000)
        first_sentence.append(((t_sent or time.perf_counter()) - t0) * 1000)
        in_tok.append(usage.input_tokens)
        out_tok.append(usage.output_tokens)
    print(f"\nLLM {model}")
    summary("time to first token", ttft)
    summary("time to first sentence", first_sentence)
    print(f"  tokens/turn (this prompt)    in {statistics.mean(in_tok):.0f}  out {statistics.mean(out_tok):.0f}")


def bench_tts(device, runs):
    from chatterbox.tts_turbo import ChatterboxTurboTTS

    t0 = time.perf_counter()
    tts = ChatterboxTurboTTS.from_pretrained(device=device)
    print(f"\nTTS Chatterbox Turbo on {device}  (load {time.perf_counter() - t0:.1f}s)")
    tts.generate("Warm up.")  # first call compiles kernels; not representative

    first_sentences = [re.split(r"(?<=[.!?])\s", r)[0] for r in REPLIES]
    synth, rtf = [], []
    for _ in range(runs):
        for text in first_sentences:
            t = time.perf_counter()
            wav = tts.generate(text)
            if device == "mps":
                torch.mps.synchronize()
            dt = time.perf_counter() - t
            synth.append(dt * 1000)
            rtf.append(dt / (wav.shape[-1] / tts.sr))
    summary("first-sentence synth (TTFA)", synth)
    print(f"  real-time factor             p50 {pct(rtf, 50):.2f}  (<1.0 = faster than playback)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--device", default="cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--models", default="claude-haiku-4-5,claude-sonnet-5")
    args = ap.parse_args()

    if os.getenv("ANTHROPIC_API_KEY"):
        for m in args.models.split(","):
            bench_llm(m, args.runs)
    else:
        print("ANTHROPIC_API_KEY not set; skipping LLM leg.")
    bench_tts(args.device, args.runs)
