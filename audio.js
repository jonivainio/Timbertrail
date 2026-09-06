(function(root) { 'use strict';
let audio=null, audioBus=null, soundOn=true, game={playSeconds:0}, overlay=null, keys={}, animals=[], waterSpots=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), distance=(a,b)=>Math.abs(a-b), seeded=n=>((Math.sin(n*91.733+17.31)*43758.5453)%1+1)%1;
const daylight=()=>.12+.88*Math.max(0,Math.sin((game.dayTime-.22)*Math.PI*2));
const audioClock={nextMusic:0,musicStep:0,nextBird:0,nextAnimal:0,nextStep:0,nextFire:0,nextWater:0};
  function ensureAudio() {
    if (!soundOn || audio) return;
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      const master = audio.createGain(), ambience = audio.createGain(), music = audio.createGain(), sfx = audio.createGain();
      const compressor = audio.createDynamicsCompressor();
      master.gain.value = .62; ambience.gain.value = .7; music.gain.value = .72; sfx.gain.value = .78;
      compressor.threshold.value = -22; compressor.knee.value = 18; compressor.ratio.value = 5; compressor.attack.value = .012; compressor.release.value = .3;
      ambience.connect(master); music.connect(master); sfx.connect(master); master.connect(compressor); compressor.connect(audio.destination);

      const seconds = 3, buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate), data = buffer.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i++) { brown = brown * .985 + (Math.random() * 2 - 1) * .035; data[i] = brown * 1.9; }

      const wind = audio.createBufferSource(), windFilter = audio.createBiquadFilter(), windGain = audio.createGain();
      wind.buffer = buffer; wind.loop = true; windFilter.type = 'bandpass'; windFilter.frequency.value = 520; windFilter.Q.value = .42; windGain.gain.value = .026;
      wind.connect(windFilter).connect(windGain).connect(ambience); wind.start();

      const rain = audio.createBufferSource(), rainFilter = audio.createBiquadFilter(), rainGain = audio.createGain();
      rain.buffer = buffer; rain.loop = true; rainFilter.type = 'highpass'; rainFilter.frequency.value = 1450; rainGain.gain.value = .0001;
      rain.connect(rainFilter).connect(rainGain).connect(ambience); rain.start();

      const windLfo = audio.createOscillator(), windDepth = audio.createGain();
      windLfo.frequency.value = .075; windDepth.gain.value = .012; windLfo.connect(windDepth).connect(windGain.gain); windLfo.start();
      audioBus = { master, ambience, music, sfx, compressor, buffer, windGain, rainGain };
      audioClock.nextMusic = audio.currentTime + .15;
      audioClock.nextBird = game.playSeconds + 3;
    } catch { soundOn = false; audio = null; audioBus = null; }
  }

  function connectWithPan(node, destination, pan = 0) {
    if (audio.createStereoPanner) {
      const panner = audio.createStereoPanner(); panner.pan.value = clamp(pan, -1, 1); node.connect(panner); panner.connect(destination); return panner;
    }
    node.connect(destination); return destination;
  }

  function noiseBurst(duration = .1, volume = .03, lowpass = 2200, highpass = 80, when = null, pan = 0) {
    if (!soundOn || !audioBus) return;
    const start = when ?? audio.currentTime, source = audio.createBufferSource(), hp = audio.createBiquadFilter(), lp = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = audioBus.buffer; hp.type = 'highpass'; hp.frequency.value = highpass; lp.type = 'lowpass'; lp.frequency.value = lowpass;
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.018, duration * .2)); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(hp).connect(lp).connect(gain); connectWithPan(gain, audioBus.sfx, pan);
    const offset = Math.random() * Math.max(.01, audioBus.buffer.duration - duration - .02); source.start(start, offset); source.stop(start + duration + .03);
  }

  function synthTone(frequency, endFrequency, duration = .1, volume = .025, type = 'sine', when = null, pan = 0, destination = null) {
    if (!soundOn || !audioBus) return;
    const start = when ?? audio.currentTime, oscillator = audio.createOscillator(), gain = audio.createGain(), filter = audio.createBiquadFilter();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start); oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, endFrequency || frequency), start + duration);
    filter.type = 'lowpass'; filter.frequency.value = Math.max(500, frequency * 3.5); filter.Q.value = .55;
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.02, duration * .2)); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(filter).connect(gain); connectWithPan(gain, destination || audioBus.sfx, pan); oscillator.start(start); oscillator.stop(start + duration + .03);
  }

  function musicNote(frequency, when, duration, volume, pan = 0) {
    if (!soundOn || !audioBus) return;
    const oscillator = audio.createOscillator(), overtone = audio.createOscillator(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    oscillator.type = 'sine'; overtone.type = 'triangle'; oscillator.frequency.value = frequency; overtone.frequency.value = frequency * 2.002;
    filter.type = 'lowpass'; filter.frequency.value = 980; filter.Q.value = .7;
    gain.gain.setValueAtTime(.0001, when); gain.gain.exponentialRampToValueAtTime(volume, when + Math.min(.75, duration * .25)); gain.gain.setValueAtTime(volume * .72, when + duration * .64); gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    oscillator.connect(filter); overtone.connect(filter); filter.connect(gain); connectWithPan(gain, audioBus.music, pan);
    oscillator.start(when); overtone.start(when); oscillator.stop(when + duration + .05); overtone.stop(when + duration + .05);
  }

  function playBird(when = null) {
    if (!soundOn || !audioBus) return;
    const start = when ?? audio.currentTime, base = 1750 + seeded(game.playSeconds) * 760, pan = seeded(game.playSeconds + 44) * 1.5 - .75;
    const phrases=[[[1,1.22,.12],[1.25,1.08,.15],[1.1,1.28,.09]],[[1.05,.91,.19],[.94,1.16,.11],[1.18,.96,.16],[1.08,1.3,.08]],[[1,1.06,.07],[1.17,1.08,.08],[1.23,.99,.17]]];
    const phrase=phrases[Math.floor(seeded(game.playSeconds+19)*phrases.length)];let at=start;
    for(const [from,to,length]of phrase){synthTone(base*from,base*to,length,.0065,'sine',at,pan,audioBus.ambience);at+=length+.055;}
    if(seeded(game.playSeconds+2)>.6){synthTone(base*.84,base*.98,.15,.003,'sine',start+1.2,-pan*.7,audioBus.ambience);synthTone(base*.95,base*.82,.2,.0028,'sine',start+1.43,-pan*.7,audioBus.ambience);}
  }

  function playSfx(name, intensity = 1, pan = 0) {
    if (!soundOn) return;
    ensureAudio();
    if (!audioBus) return;
    const now = audio.currentTime, v = intensity;
    if (name === 'uiOpen') { synthTone(218, 292, .11, .018 * v, 'triangle', now, pan); noiseBurst(.055, .009 * v, 1600, 330, now, pan); }
    else if (name === 'uiClose') synthTone(270, 190, .09, .014 * v, 'triangle', now, pan);
    else if (name === 'pageTurn') { noiseBurst(.32, .035 * v, 4800, 600, now, pan); noiseBurst(.18, .025 * v, 3500, 700, now + .12, pan); noiseBurst(.10, .017 * v, 5300, 850, now + .25, pan); }
    else if (name === 'pageFlip') { noiseBurst(.18, .033 * v, 4700, 650, now, pan); noiseBurst(.09, .018 * v, 3200, 950, now + .1, pan); }
    else if (name === 'uiTick') synthTone(390, 430, .035, .008 * v, 'sine', now, pan);
    else if (name === 'deny') synthTone(118, 92, .13, .022 * v, 'triangle', now, pan);
    else if (name === 'step') { noiseBurst(.09, .026 * v, 760, 45, now, pan); synthTone(82, 55, .07, .014 * v, 'sine', now, pan); }
    else if (name === 'wood') { noiseBurst(.13, .035 * v, 1180, 120, now, pan); synthTone(126, 74, .11, .021 * v, 'triangle', now, pan); }
    else if (name === 'stone') { synthTone(690, 570, .12, .022 * v, 'sine', now, pan); synthTone(1030, 790, .08, .013 * v, 'sine', now + .025, pan); }
    else if (name === 'rustle') { noiseBurst(.22, .021 * v, 3100, 520, now, pan); noiseBurst(.15, .014 * v, 2100, 350, now + .11, pan); }
    else if (name === 'pickup') { synthTone(330, 455, .1, .014 * v, 'triangle', now, pan); noiseBurst(.08, .01 * v, 1900, 250, now, pan); }
    else if (name === 'axe') { noiseBurst(.12, .06 * v, 1350, 75, now, pan); synthTone(104, 57, .16, .04 * v, 'triangle', now + .01, pan); noiseBurst(.18, .026 * v, 670, 50, now + .07, pan); }
    else if (name === 'water') { noiseBurst(.72, .026 * v, 2600, 480, now, pan); synthTone(410, 260, .38, .009 * v, 'sine', now + .05, pan); }
    else if (name === 'fire') { for (let i = 0; i < 4; i++) noiseBurst(.035 + i * .012, (.014 + i * .002) * v, 3300, 600, now + i * .045, pan); }
    else if (name === 'eat') { noiseBurst(.11, .028 * v, 1500, 180, now, pan); noiseBurst(.1, .023 * v, 1250, 150, now + .14, pan); }
    else if (name === 'equip') { noiseBurst(.18, .022 * v, 1300, 140, now, pan); synthTone(245, 285, .08, .012 * v, 'triangle', now + .08, pan); }
    else if (name === 'craft') { playSfx('wood', .7 * v, pan); playSfx('stone', .55 * v, pan); synthTone(294, 440, .28, .018 * v, 'triangle', now + .18, pan); }
    else if (name === 'task') { synthTone(294, 294, .36, .015 * v, 'sine', now, pan); synthTone(370, 370, .42, .013 * v, 'sine', now + .12, pan); synthTone(440, 440, .55, .012 * v, 'sine', now + .24, pan); }
    else if (name === 'bow') { noiseBurst(.12, .026 * v, 3600, 620, now, pan); synthTone(188, 96, .18, .025 * v, 'triangle', now, pan); }
    else if (name === 'impact') { noiseBurst(.14, .045 * v, 780, 48, now, pan); synthTone(75, 48, .16, .03 * v, 'sine', now, pan); }
    else if (name === 'cast') { noiseBurst(.34, .019 * v, 4200, 900, now, pan); synthTone(510, 260, .3, .009 * v, 'sine', now + .04, pan); }
    else if (name === 'catch') { noiseBurst(.38, .035 * v, 3000, 380, now, pan); synthTone(330, 520, .25, .018 * v, 'triangle', now + .08, pan); }
    else if (name === 'miss') { synthTone(210, 125, .22, .016 * v, 'sine', now, pan); noiseBurst(.18, .012 * v, 1800, 340, now, pan); }
    else if (name === 'sleep') { noiseBurst(1.1, .02 * v, 820, 30, now, pan); synthTone(174, 220, 1.4, .018 * v, 'sine', now, pan); }
    else if (name === 'trade') { synthTone(392, 523, .22, .017 * v, 'triangle', now, pan); synthTone(659, 659, .34, .01 * v, 'sine', now + .16, pan); }
    else if (name === 'dog') { synthTone(142, 104, .22, .028 * v, 'sawtooth', now, pan); noiseBurst(.16, .015 * v, 720, 90, now, pan); }
    else if (name === 'travel') { noiseBurst(.85, .022 * v, 1150, 70, now, pan); synthTone(196, 294, .9, .014 * v, 'sine', now + .05, pan); }
  }

  function tone(frequency, duration = .06, volume = .025) {
    if (!soundOn) return;
    ensureAudio();
    if (audioBus) synthTone(frequency, frequency, duration, volume, 'triangle');
  }

  function updateAudio() {
    if (!soundOn || !audioBus || audio.state === 'suspended' || !game.running) return;
    const now = audio.currentTime;
    if (audioClock.nextMusic < now - .2) audioClock.nextMusic = now + .08;
    audioBus.rainGain.gain.setTargetAtTime(game.weather === 'rain' ? .075 : .0001, now, 1.25);
    audioBus.windGain.gain.setTargetAtTime(game.weather === 'rain' ? .041 : .022 + (1 - daylight()) * .009, now, 1.8);

    const roots = [146.83, 174.61, 130.81, 196.0], melody = [293.66, 329.63, 440, 392, 329.63, 261.63, 293.66, 220];
    while (audioClock.nextMusic < now + .8) {
      const step = audioClock.musicStep++, root = roots[Math.floor(step / 2) % roots.length], when = audioClock.nextMusic;
      musicNote(root, when, 5.4, game.weather === 'rain' ? .009 : .014, -.16);
      if (step % 2 === 0) musicNote(root * 1.5, when + .18, 4.8, .0075, .17);
      if (step % 3 !== 1) musicNote(melody[step % melody.length], when + .72, 2.4, .0065, seeded(step) * .5 - .25);
      audioClock.nextMusic += 3.25;
    }

    if (daylight() > .42 && game.weather !== 'rain' && game.playSeconds >= audioClock.nextBird) {
      playBird(); audioClock.nextBird = game.playSeconds + 4.5 + seeded(game.playSeconds + 77) * 8;
    } else if (daylight() < .24 && game.weather !== 'rain' && game.playSeconds >= audioClock.nextBird) {
      const pan = seeded(game.playSeconds + 91) * 1.4 - .7;
      for (let i = 0; i < 3; i++) synthTone(2350 + i * 170, 2210 + i * 150, .035, .0028, 'sine', now + i * .11, pan, audioBus.ambience);
      audioClock.nextBird = game.playSeconds + 2.8 + seeded(game.playSeconds + 33) * 4.5;
    }
    if (game.player.moving && !overlay && game.playSeconds >= audioClock.nextStep) {
      const crouching = game.player.crouching, running = !crouching && (keys.ShiftLeft || keys.ShiftRight);
      playSfx('step', crouching ? .32 : running ? 1.12 : .76, game.player.facing * .05);
      audioClock.nextStep = game.playSeconds + (crouching ? .62 : running ? .29 : .46);
    }
    const nearFire = game.structures.find(s => (s.type === 'fire' || s.type === 'oldfire') && s.lit && distance(s.x, game.player.x) < 115);
    if (nearFire && game.playSeconds >= audioClock.nextFire) {
      playSfx('fire', clamp(1 - distance(nearFire.x, game.player.x) / 150, .22, .72), clamp((nearFire.x - game.player.x) / 110, -.7, .7));
      audioClock.nextFire = game.playSeconds + .32 + seeded(game.playSeconds) * .48;
    }
    const nearWater = waterSpots.find(w => distance(w.x, game.player.x) < 150);
    if (nearWater && game.playSeconds >= audioClock.nextWater) {
      noiseBurst(.7, .009 * clamp(1 - distance(nearWater.x, game.player.x) / 180, .2, 1), 2100, 300, now, clamp((nearWater.x - game.player.x) / 130, -.75, .75));
      audioClock.nextWater = game.playSeconds + 1.1 + seeded(game.playSeconds + 12) * .9;
    }
    const nearAnimal = animals.find(a => a.alive && a.type !== 'bear' && distance(a.x, game.player.x) < 175 && Math.abs(a.vx) > 18);
    if (nearAnimal && game.playSeconds >= audioClock.nextAnimal) {
      const pan = clamp((nearAnimal.x - game.player.x) / 160, -.8, .8);
      playSfx('rustle', nearAnimal.type === 'deer' ? .42 : .25, pan);
      if (nearAnimal.type === 'grouse') noiseBurst(.28, .012, 3900, 720, now + .08, pan);
      audioClock.nextAnimal = game.playSeconds + 1.5 + seeded(game.playSeconds + 66) * 2.5;
    }
  }


root.PEAudio={
  play:playSfx,
  start(state){game=state;ensureAudio();audio?.resume?.();},
  toggle(){soundOn=!soundOn;if(soundOn){ensureAudio();audio?.resume?.();audioClock.nextMusic=(audio?.currentTime||0)+.1;}if(audioBus)audioBus.master.gain.setTargetAtTime(soundOn?.62:.0001,audio.currentTime,.15);return soundOn;},
  pause(paused){if(audioBus)audioBus.master.gain.setTargetAtTime(paused?.0001:(soundOn?.62:.0001),audio.currentTime,.15);if(!paused&&audio)audioClock.nextMusic=audio.currentTime+.1;},
  update(state,engine,paused){game=state;keys=engine.keys;animals=state.animals;waterSpots=engine.water;overlay=paused;updateAudio();}
};
})(typeof window!=='undefined'?window:globalThis);
