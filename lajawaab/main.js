// main.js — page wiring: layers, comp, the render contract, and the ?test=pose model sheet.
import { makeComp, layerSet } from './comp.js';
import { DUR, EV, TEXTS } from './story.js';
import * as S from './scene.js';
import { figure, POSE, VERM } from './figure.js';
import { seal } from './seal.js';
import { inkText } from './subs.js';
import { TONE } from './ink.js';

const q = new URLSearchParams(location.search);
const comp = makeComp(document.getElementById('c'));
const A = layerSet(), B = layerSet(), TMP = layerSet();
const mode = q.get('test');

await document.fonts.load('600 62px CormorantSC');
await document.fonts.load('600 68px CormorantSC');
await document.fonts.load('500 40px CormorantSC');
await document.fonts.load('italic 500 46px Cormorant');
await document.fonts.load('italic 500 34px Cormorant');
await document.fonts.load('italic 500 22px Cormorant');
await document.fonts.load('40px MaShanZheng', '水');

let render;
if (mode === 'pose') {
  // model sheet: the four key poses + tone swatches + the seal
  window.DUR = 1;
  render = t => {
    A.clear(); B.clear();
    const poses = [POSE.stand, POSE.walkA, POSE.slump, POSE.turnAway];
    const names = ['stand', 'walk', 'slump', 'turn away'];
    for (let i = 0; i < 4; i++) {
      figure(A.ink, poses[i], { x: 300 + i * 400, y: 720, s: 5.2, dir: 1, am: 1, seed: 7 + i, p: 1, boil: 0, dark: .7 - i * .08, hair: i % 2 });
      inkText(A, names[i], 300 + i * 400, 850, 1, { font: 'italic 500 28px Cormorant', alpha: .8 });
    }
    const tones = [['paper', null], ['jiao', TONE.jiao], ['nong', TONE.nong], ['zhong', TONE.zhong], ['dan', TONE.dan], ['qing', TONE.qing], ['vermilion', 'verm']];
    for (let i = 0; i < tones.length; i++) {
      const col = i % 2, row = (i / 2) | 0;
      const x = 1270 + col * 190, y = 585 + row * 88;
      A.cd.save(); A.cd.setTransform(1, 0, 0, 1, 0, 0);
      A.cd.fillStyle = tones[i][1] === 'verm' ? `rgb(${VERM.join(',')})` : tones[i][1] === null ? '#F2ECDE' : `rgba(33,26,20,${tones[i][1]})`;
      A.cd.fillRect(x, y, 104, 54);
      A.cd.restore();
      inkText(A, tones[i][0], x - 16, y + 28, 1, { font: 'italic 500 24px Cormorant', align: 'right', alpha: .85 });
    }
    A.cc.save(); A.cc.setTransform(1, 0, 0, 1, 0, 0); seal(A.cc, 1395, 245, 86, .95, 5); A.cc.restore();
    comp(A, B, { paper: [0, 0, 1], vig: .12, warm: .5 });
  };
} else {
  S.init();
  window.DUR = DUR;
  window.EV = EV;
  window.TEXTS = t => TEXTS.filter(e => t >= e.t0 && t <= e.t1);
  render = t => {
    A.clear(); B.clear();
    const o = S.frame(t, A, B, TMP) || {};
    comp(A, B, o);
  };
}
window.render = render;
window.READY = true;
