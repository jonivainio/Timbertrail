"""Offline mastering of the licensed originals. Needs Python + NumPy, no network.

Usage: python scripts/refine-audio.py --sources work/audio
Inputs are mono 24 kHz float .npy decodes named by Pixabay source ID. Original
downloads stay local; source attribution and every processing choice are tracked.
This measures signal properties; it does not claim subjective listening approval.
"""
import argparse, hashlib, io, json, pathlib, wave
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
RATE, FFT, HOP = 24000, 1024, 256


def smooth(a, axis, passes=2):
    for _ in range(passes):
        pad = [(0, 0)] * a.ndim
        pad[axis] = (1, 1)
        p = np.pad(a, pad, mode='edge')
        a = (np.take(p, range(a.shape[axis]), axis=axis)
             + 2*np.take(p, range(1, a.shape[axis]+1), axis=axis)
             + np.take(p, range(2, a.shape[axis]+2), axis=axis)) / 4
    return a


def clean(raw, settings):
    """Soft spectral attenuation with a measured stationary noise profile.

    Smooth masks in both axes and retain a nonzero floor to avoid binary gating
    and isolated 'musical noise' bins. The spectral filter is also smoothly tapered.
    Rain/wind are desired broadband sound, so do not treat them as unwanted noise.
    """
    a = np.asarray(raw, dtype=np.float64)
    a = a - np.mean(a)
    padded = np.pad(a, (FFT, FFT + HOP))
    frames = np.lib.stride_tricks.sliding_window_view(padded, FFT)[::HOP]
    window = np.hanning(FFT)
    spectrum = np.fft.rfft(frames * window)
    power = np.abs(spectrum)**2
    noise = np.quantile(power, .25, axis=0)
    ratio = settings['noiseStrength'] * noise / np.maximum(power, 1e-14)
    mask = np.maximum(settings['noiseFloor'], 1-ratio)
    mask = smooth(smooth(mask, 1, 2), 0, 3)
    frequency = np.fft.rfftfreq(FFT, 1/RATE)
    hp, lp = settings['highpass'], settings['lowpass']
    # Raised-cosine transitions reach a flat pass band, with no brick-wall corners.
    low = np.sin(np.clip((frequency-hp*.55)/(hp*.9), 0, 1)*np.pi/2)**2
    high = np.cos(np.clip((frequency-lp*.8)/(lp*.35), 0, 1)*np.pi/2)**2
    processed = np.fft.irfft(spectrum * mask * low * high, n=FFT) * window
    signal = np.zeros(len(padded))
    weights = np.zeros(len(padded))
    for i, frame in enumerate(processed):
        offset = i*HOP
        signal[offset:offset+FFT] += frame
        weights[offset:offset+FFT] += window**2
    signal /= np.maximum(weights, 1e-12)
    return signal[FFT:FFT+len(a)]


def fade(a, attack, release):
    n = min(round(attack*RATE), len(a)//2)
    m = min(round(release*RATE), len(a)//2)
    if n: a[:n] *= np.sin(np.linspace(0, np.pi/2, n))**2
    if m: a[-m:] *= np.cos(np.linspace(0, np.pi/2, m))**2
    a[0] = a[-1] = 0
    return a


def pcm(a):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((np.clip(a, -.99, .99)*32767).astype('<i2').tobytes())
    return buf.getvalue()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=pathlib.Path, required=True)
    parser.add_argument('--event', help='Rebuild one event and preserve the other registrations')
    args = parser.parse_args()
    plan = json.loads((ROOT/'assets/audio-processing.json').read_text())
    if args.event:
        plan = [e for e in plan if e['event'] == args.event]
        if not plan: parser.error('Unknown sound event')
    output = ROOT/'assets/audio'
    report, manifest = [], []
    raw_cache, clean_cache = {}, {}
    for e in plan:
        sid = e['sourceId']
        if sid not in raw_cache:
            raw_cache[sid] = np.load(args.sources/(sid+'.npy'))
        raw = raw_cache[sid]
        key = (sid, e['highpass'], e['lowpass'], e['noiseStrength'], e['noiseFloor'])
        if key not in clean_cache:
            clean_cache[key] = clean(raw, e)
        signal = clean_cache[key]
        parts, regions, start_at = [], [], 0
        for start, length in e.get('ranges', [[e['start'], e['length']]]):
            first, last = round(start*RATE), round((start+length)*RATE)
            assert 0 <= first < last <= len(signal), e['event']
            a = signal[first:last].copy()
            before = raw[first:last]
            if e['loop']:
                overlap = min(round(e.get('seam', .3)*RATE), len(a)//3)
                t = np.sin(np.linspace(0, np.pi/2, overlap))**2
                a[:overlap] = a[-overlap:]*(1-t)+a[:overlap]*t
                a = a[:-overlap]
            else:
                a = fade(a, e['fadeIn'], e['fadeOut'])
            # Master by active 40 ms windows, not by silence-padded whole-clip RMS.
            frames = a[:len(a)//960*960].reshape(-1, 960)
            rms = np.sqrt(np.mean(frames**2, axis=1))
            active_level = float(np.quantile(rms, .8))
            scale = min(e['maxBoost'], e['target']/max(active_level, 1e-8),
                        .42/max(float(np.max(abs(a))), 1e-8))
            a *= scale
            if not e['loop']: a[0] = a[-1] = 0
            regions.append(dict(offset=start_at/RATE, duration=len(a)/RATE))
            parts.append(a); start_at += len(a)
            report.append(dict(event=e['event'], start=start,
                               rawRms=float(np.sqrt(np.mean(before**2))),
                               cleanedRms=float(np.sqrt(np.mean(signal[first:last]**2))),
                               outputRms=float(np.sqrt(np.mean(a*a))), scale=scale))
        data = pcm(np.concatenate(parts)); sha = hashlib.sha256(data).hexdigest()
        name = e['event']+'-'+sha+'.wav'
        (output/name).write_bytes(data)
        entry = {k:e[k] for k in ['event','source','title','creator','downloadedOn','gain','loop','attack','release','loopAttack','loopRelease']}
        entry.update(reviewed=True, listeningReviewed=False, offset=0,
                     duration=regions[0]['duration'], file=name, sha256=sha,
                     license='Pixabay Content License', licenseUrl='https://pixabay.com/service/terms/',
                     notes=f"Refined from original source {sid}; smoothed spectral noise attenuation strength {e['noiseStrength']}, floor {e['noiseFloor']}; soft band {e['highpass']}–{e['lowpass']} Hz. Active-window leveling, at most {e['maxBoost']}x boost, peak <=0.42. "
                     + (f"Circular overlap {e.get('seam', .3)} s; gradual live gain and stop." if e['loop'] else f"Raised-cosine asset attack {e['fadeIn']} s / release {e['fadeOut']} s, plus live envelope.")
                     + " Exact cuts in assets/audio-processing.json. Listening review pending.")
        if len(regions)>1: entry['regions'] = regions
        manifest.append(entry)
    if args.event:
        manifest += [e for e in json.loads((output/'library.json').read_text(encoding='utf-8')) if e['event'] != args.event]
    (output/'library.json').write_text(json.dumps(sorted(manifest,key=lambda e:e['event']),indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    (args.sources/'refinement').mkdir(exist_ok=True)
    (args.sources/'refinement/report.json').write_text(json.dumps(report,indent=2))
    print(f'Refined {len(manifest)} events; originals and previous samples preserved.')


if __name__ == '__main__': main()
