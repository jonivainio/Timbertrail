(function(root) { 'use strict';
let audio=null, audioBus=null, soundOn=true, game={playSeconds:0}, overlay=null, keys={}, animals=[], waterSpots=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), distance=(a,b)=>Math.abs(a-b), seeded=n=>((Math.sin(n*91.733+17.31)*43758.5453)%1+1)%1;
const daylight=()=>.12+.88*Math.max(0,Math.sin((game.dayTime-.22)*Math.PI*2));
const preferences={soundOn:true,musicOn:true,soundVolume:.7,musicVolume:.4};
try{const saved=JSON.parse(localStorage.getItem('timbertrail-audio')||'{}');for(const key of ['soundOn','musicOn'])if(typeof saved[key]==='boolean')preferences[key]=saved[key];for(const key of ['soundVolume','musicVolume'])if(Number.isFinite(saved[key]))preferences[key]=clamp(saved[key],0,1);}catch{}
soundOn=preferences.soundOn;
const musicWindow=seconds=>{const phase=((seconds-18)%240+240)%240;return seconds>=18&&phase<42;};
function applyMix(){if(!audioBus)return;const t=audio.currentTime;audioBus.ambience.gain.setTargetAtTime(soundOn?preferences.soundVolume*.7:0,t,.12);audioBus.sfx.gain.setTargetAtTime(soundOn?preferences.soundVolume*.78:0,t,.12);audioBus.music.gain.setTargetAtTime(preferences.musicOn?preferences.musicVolume*.48:0,t,.5);}
function configure(patch){for(const key of ['soundOn','musicOn'])if(typeof patch[key]==='boolean')preferences[key]=patch[key];for(const key of ['soundVolume','musicVolume'])if(Number.isFinite(patch[key]))preferences[key]=clamp(patch[key],0,1);soundOn=preferences.soundOn;ensureAudio();audio?.resume?.();applyMix();try{localStorage.setItem('timbertrail-audio',JSON.stringify(preferences));}catch{}return {...preferences};}
const audioClock={nextMusic:0,musicStep:0,nextBird:0,nextAnimal:0,nextStep:0,nextFire:0,nextFireCrackle:0,nextWater:0};
  function ensureAudio() {
    if ((!soundOn && !preferences.musicOn) || audio) return;
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
      // A separate, broadband friction source gives dry fibres and wood detail.
      // The slow brown-noise ambience buffer is intentionally left unchanged.
      const foleyBuffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),foley=foleyBuffer.getChannelData(0);let soft=0;
      for(let i=0;i<foley.length;i++){const white=Math.random()*2-1;soft=soft*.8+white*.2;foley[i]=soft*.65+white*.2;}

      const wind = audio.createBufferSource(), windFilter = audio.createBiquadFilter(), windGain = audio.createGain();
      wind.buffer = buffer; wind.loop = true; windFilter.type = 'bandpass'; windFilter.frequency.value = 520; windFilter.Q.value = .42; windGain.gain.value = 0;
      wind.connect(windFilter).connect(windGain).connect(ambience); wind.start();

      const rain = audio.createBufferSource(), rainFilter = audio.createBiquadFilter(), rainGain = audio.createGain();
      rain.buffer = buffer; rain.loop = true; rainFilter.type = 'highpass'; rainFilter.frequency.value = 1450; rainGain.gain.value = .0001;
      rain.connect(rainFilter).connect(rainGain).connect(ambience); rain.start();

      const windLfo = audio.createOscillator(), windDepth = audio.createGain();
      windLfo.frequency.value = .075; windDepth.gain.value = 0; windLfo.connect(windDepth).connect(windGain.gain); windLfo.start();
      audioBus = { master, ambience, music, sfx, compressor, buffer, foleyBuffer, windGain, rainGain };
      applyMix();audioClock.nextMusic = audio.currentTime + .15;
      audioClock.nextBird = game.playSeconds + 3;
    } catch { soundOn = false; audio = null; audioBus = null; }
  }

  function connectWithPan(node, destination, pan = 0) {
    if (audio.createStereoPanner) {
      const panner = audio.createStereoPanner(); panner.pan.value = clamp(pan, -1, 1); node.connect(panner); panner.connect(destination); return panner;
    }
    node.connect(destination); return destination;
  }

  function noiseBurst(duration = .1, volume = .03, lowpass = 2200, highpass = 80, when = null, pan = 0, texture = false, attack = .018) {
    if (!soundOn || !audioBus) return;
    const start = when ?? audio.currentTime, source = audio.createBufferSource(), hp = audio.createBiquadFilter(), lp = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = texture?audioBus.foleyBuffer:audioBus.buffer; hp.type = 'highpass'; hp.frequency.value = highpass; lp.type = 'lowpass'; lp.frequency.value = lowpass;
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(attack, duration * .35)); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(hp).connect(lp).connect(gain); connectWithPan(gain, audioBus.sfx, pan);
    const offset = Math.random() * Math.max(.01, source.buffer.duration - duration - .02); source.start(start, offset); source.stop(start + duration + .03);
  }

  function materialFoley(kind,v,now,pan){
    // Contact, friction, then settling into the pack. No oscillators or pitch sweeps.
    // [offset, duration, gain, lowpass, highpass]; irregular timing avoids a UI cadence.
    const patterns={
      gatherWood:[[0,.09,.07,1100,110],[.045,.22,.027,2300,390],[.19,.055,.045,1500,180]],
      gatherStone:[[0,.045,.07,2700,620],[.042,.075,.046,1700,260],[.105,.14,.025,850,100]],
      gatherGrass:[[0,.25,.042,5100,1050],[.08,.16,.031,3300,660],[.23,.13,.018,2600,460]],
      gatherFruit:[[0,.18,.03,3900,850],[.105,.06,.031,1450,180],[.18,.15,.018,2100,380]],
      gatherMushroom:[[0,.16,.038,1500,150],[.08,.065,.032,2500,520],[.19,.19,.018,2300,350]],
      skin:[[0,.27,.03,2100,480],[.13,.21,.034,3100,650],[.33,.24,.021,1200,120]],
      pickup:[[0,.18,.029,2400,300],[.12,.13,.024,1200,130]]
    };
    for(const [offset,length,gain,lp,hp]of patterns[kind]||patterns.pickup){const variation=.9+Math.random()*.2;noiseBurst(length*variation,gain*v*(.86+Math.random()*.2),lp*variation,hp,now+offset*(.92+Math.random()*.16),pan,true);}
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
    if (!preferences.musicOn || !audioBus) return;
    const oscillator = audio.createOscillator(), overtone = audio.createOscillator(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    oscillator.type = 'sine'; overtone.type = 'sine'; oscillator.frequency.value = frequency; overtone.frequency.value = frequency * 2;
    filter.type = 'lowpass'; filter.frequency.value = 980; filter.Q.value = .7;
    gain.gain.setValueAtTime(.0001, when); gain.gain.exponentialRampToValueAtTime(volume, when + Math.min(.75, duration * .25)); gain.gain.setValueAtTime(volume * .72, when + duration * .64); gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    oscillator.connect(filter); const overtoneGain=audio.createGain();overtoneGain.gain.value=.09;overtone.connect(overtoneGain).connect(filter); filter.connect(gain); connectWithPan(gain, audioBus.music, pan);
    oscillator.start(when); overtone.start(when); oscillator.stop(when + duration + .05); overtone.stop(when + duration + .05);
  }

  function playBird(when = null) {
    if (!soundOn || !audioBus) return;
    const start = when ?? audio.currentTime, base = 1750 + seeded(game.playSeconds) * 760, pan = seeded(game.playSeconds + 44) * 1.5 - .75;
    const phrases=[[[1,1.22,.12],[1.25,1.08,.15],[1.1,1.28,.09]],[[1.05,.91,.19],[.94,1.16,.11],[1.18,.96,.16],[1.08,1.3,.08]],[[1,1.06,.07],[1.17,1.08,.08],[1.23,.99,.17]]];
    const phrase=phrases[Math.floor(seeded(game.playSeconds+19)*phrases.length)];let at=start;
    for(const [from,to,length]of phrase){synthTone(base*from,base*to,length,.0082,'sine',at,pan,audioBus.ambience);at+=length+.055;}
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
    else if(name==='drink'){noiseBurst(.22,.019*v,1350,140,now,pan);noiseBurst(.17,.012*v,900,190,now+.25,pan);synthTone(360,200,.1,.007*v,'sine',now+.12,pan);}
    else if(name==='pour'){noiseBurst(.65,.025*v,2300,360,now,pan);for(let i=0;i<5;i++)synthTone(310+i*53,210+i*47,.07,.007*v,'sine',now+i*.1,pan);}
    else if(['door','shutter','chestOpen'].includes(name)){noiseBurst(.34,.014*v,650,85,now,pan);synthTone(name==='door'?145:210,90,.28,.009*v,'triangle',now,pan);noiseBurst(.06,.027*v,820,75,now+.31,pan);}
    else if(['cloth','storage'].includes(name)){noiseBurst(.28,.019*v,1650,270,now,pan);if(name==='storage')noiseBurst(.06,.016*v,750,120,now+.2,pan);}
    else if(name==='floorStep'){noiseBurst(.08,.014*v,410,45,now,pan);synthTone(98,68,.07,.008*v,'triangle',now,pan);}
    else if (name === 'step') { noiseBurst(.09, .026 * v, 760, 45, now, pan); synthTone(82, 55, .07, .014 * v, 'sine', now, pan); }
    else if (name === 'wood') { noiseBurst(.13, .035 * v, 1180, 120, now, pan); synthTone(126, 74, .11, .021 * v, 'triangle', now, pan); }
    else if (name === 'stone') { synthTone(690, 570, .12, .022 * v, 'sine', now, pan); synthTone(1030, 790, .08, .013 * v, 'sine', now + .025, pan); }
    else if (name === 'rustle') { noiseBurst(.22, .021 * v, 3100, 520, now, pan); noiseBurst(.15, .014 * v, 2100, 350, now + .11, pan); }
    else if (['pickup','gatherWood','gatherStone','gatherGrass','gatherFruit','gatherMushroom','skin'].includes(name))materialFoley(name,v,now,pan);
    else if (name === 'axe') { noiseBurst(.12, .06 * v, 1350, 75, now, pan); synthTone(104, 57, .16, .04 * v, 'triangle', now + .01, pan); noiseBurst(.18, .026 * v, 670, 50, now + .07, pan); }
    else if (name === 'water') { noiseBurst(.72, .026 * v, 2600, 480, now, pan); synthTone(410, 260, .38, .009 * v, 'sine', now + .05, pan); }
    else if(name==='fireBed'){noiseBurst(1.65,.026*v,1150,95,now,pan,false,.38);noiseBurst(1.12,.006*v,2200,480,now+.3,pan,true,.24);}
    else if(name==='fire'||name==='fireCrackle'){const q=Math.random();noiseBurst(.018+q*.018,.032*v,2300+q*1100,520,now,pan,true);noiseBurst(.12+q*.12,.014*v,1250,160,now+.012,pan,true);if(q>.76)noiseBurst(.025,.017*v,2600,630,now+.13+q*.06,pan,true);}
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
    if (!audioBus || audio.state === 'suspended') return;
    if(!game.running){audioBus.rainGain.gain.setTargetAtTime(0,audio.currentTime,.5);audioBus.windGain.gain.setTargetAtTime(0,audio.currentTime,.5);audioBus.music.gain.setTargetAtTime(0,audio.currentTime,.7);return;}
    const now = audio.currentTime;
    if (audioClock.nextMusic < now - .2) audioClock.nextMusic = now + .08;
    const inside=!!game.cabinHome?.inside;const rain=game.weather==='rain'?(game.rainIntensity??.3):0;
    audioBus.rainGain.gain.setTargetAtTime((rain>.8?.06:rain>.45?.023:rain>0?.008:0)*(inside?.18:1),now,3);
    // Short leaf-rustling gusts, with long genuinely quiet gaps.
    const windPhase=game.playSeconds%73,gust=windPhase<11?Math.sin(windPhase/11*Math.PI)**2:0;
    audioBus.windGain.gain.setTargetAtTime(gust*(rain>.8?.035:.017)*(inside?.12:1),now,1.2);
    const playingMusic=preferences.musicOn&&musicWindow(game.playSeconds)&&rain<.45;
    audioBus.music.gain.setTargetAtTime(playingMusic?preferences.musicVolume*.48:0,now,1.8);
    if(!playingMusic)audioClock.nextMusic=now+.15;
    const melody=[293.66,369.99,440,369.99,329.63,293.66,246.94,329.63];
    while(playingMusic&&audioClock.nextMusic<now+.5){
      const step=audioClock.musicStep++,when=audioClock.nextMusic;
      musicNote(melody[step%melody.length],when,3.6,.009,Math.sin(step)*.24);
      if(step%4===2)musicNote(melody[(step+2)%melody.length]*.5,when+1.1,3.2,.003,-.15);
      audioClock.nextMusic+=5.1;
    }

    if (!inside && daylight() > .42 && game.weather !== 'rain' && game.playSeconds >= audioClock.nextBird) {
      playBird(); audioClock.nextBird = game.playSeconds + 3.8 + seeded(game.playSeconds + 77) * 6.8;
    } else if (!inside && daylight() < .24 && game.weather !== 'rain' && game.playSeconds >= audioClock.nextBird) {
      const pan = seeded(game.playSeconds + 91) * 1.4 - .7;
      for (let i = 0; i < 3; i++) synthTone(2350 + i * 170, 2210 + i * 150, .035, .0028, 'sine', now + i * .11, pan, audioBus.ambience);
      audioClock.nextBird = game.playSeconds + 2.8 + seeded(game.playSeconds + 33) * 4.5;
    }
    if (game.player.moving && !overlay && game.playSeconds >= audioClock.nextStep) {
      const crouching = game.player.crouching, running = game.player.running;
      playSfx(inside?'floorStep':game.player.wading?'water':'step',game.player.wading?.25:crouching?.32:running?1.12:.76,game.player.facing*.05);
      audioClock.nextStep = game.playSeconds + (crouching ? .62 : running ? .29 : .46);
    }
    const nearFire=inside?(game.cabinHome.fire.lit&&game.cabinHome.fire.fuel>0?{x:game.player.x}:null):game.structures.filter(s=>(s.type==='fire'||s.type==='oldfire')&&s.lit&&s.fuel>0&&distance(s.x,game.player.x)<150).sort((a,b)=>distance(a.x,game.player.x)-distance(b.x,game.player.x))[0];
    if(nearFire){
      const volume=inside?.65:Math.pow(clamp(1-distance(nearFire.x,game.player.x)/150),1.4)*.8,pan=inside?clamp((468-(game.cabinHome.x||480))/320,-.6,.6):clamp((nearFire.x-game.player.x)/150,-.7,.7);
      if(game.playSeconds>=audioClock.nextFire){playSfx('fireBed',volume,pan);audioClock.nextFire=game.playSeconds+1.05+seeded(game.playSeconds)*.2;}
      if(game.playSeconds>=audioClock.nextFireCrackle){playSfx('fireCrackle',volume*(.6+seeded(game.playSeconds+9)*.4),pan);audioClock.nextFireCrackle=game.playSeconds+2.1+seeded(game.playSeconds+71)*4.2;}
    }else{audioClock.nextFire=game.playSeconds;audioClock.nextFireCrackle=game.playSeconds+.6;}
    const nearWater = !inside&&waterSpots.find(w => distance(w.x, game.player.x) < 150);
    if (nearWater && game.playSeconds >= audioClock.nextWater) {
      noiseBurst(.7, .009 * clamp(1 - distance(nearWater.x, game.player.x) / 180, .2, 1), 2100, 300, now, clamp((nearWater.x - game.player.x) / 130, -.75, .75));
      audioClock.nextWater = game.playSeconds + 1.1 + seeded(game.playSeconds + 12) * .9;
    }
    const nearAnimal = !inside&&animals.find(a => a.alive && a.type !== 'bear' && distance(a.x, game.player.x) < 175 && Math.abs(a.vx) > 18);
    if (nearAnimal && game.playSeconds >= audioClock.nextAnimal) {
      const pan = clamp((nearAnimal.x - game.player.x) / 160, -.8, .8);
      playSfx('rustle', nearAnimal.type === 'deer' ? .42 : .25, pan);
      if (nearAnimal.type === 'grouse') noiseBurst(.28, .012, 3900, 720, now + .08, pan);
      audioClock.nextAnimal = game.playSeconds + 1.5 + seeded(game.playSeconds + 66) * 2.5;
    }
  }


root.PEAudio={
  play:playSfx,
  settings:()=>({...preferences}),configure,musicWindow,
  start(state){game=state;ensureAudio();audio?.resume?.();},
  toggle(){configure({soundOn:!soundOn});return soundOn;},
  pause(paused){if(audioBus)audioBus.master.gain.setTargetAtTime(paused?.0001:.62,audio.currentTime,.15);if(!paused&&audio)audioClock.nextMusic=audio.currentTime+.1;},
  update(state,engine,paused){game=state;keys=engine.keys;animals=state.animals;waterSpots=engine.water;overlay=paused;updateAudio();}
};
})(typeof window!=='undefined'?window:globalThis);
