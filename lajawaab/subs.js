// subs.js — screen-space text: inscriptions (题跋) and the end card. All text is drawn with the transform
// RESET first (STYLE pitfall: a world transform would scatter screen coordinates), on the dry layer (crisp ink).
import { VERM } from './figure.js';

// inkText(A, text, x, y, k, opts): centred at (x, y) unless align:'left'; k = fade-in 0..1
export function inkText(A, text, x, y, k = 1, o = {}) {
  if (k <= 0) return;
  const c = A.cd;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, k) * (o.alpha ?? 1);
  c.fillStyle = '#211a14';
  c.font = o.font || '500 34px Cormorant';
  c.letterSpacing = o.tracking || '0px';
  c.textAlign = o.align === 'left' ? 'left' : 'center';
  c.textBaseline = 'middle';
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); c.fillText(text, 0, 0); }
  else c.fillText(text, x, y);
  c.restore();
}

// subtitle(A, text, x, y, k, opts): an inscription in the liubai — small vermilion seal-square + italic serif
export function subtitle(A, text, x, y, k = 1, o = {}) {
  if (k <= 0) return;
  const size = o.size || 46;
  const c = A.cd;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, k) * (o.alpha ?? .92);
  // the vermilion square (a tiny seal mark before the line)
  A.cc.save(); A.cc.setTransform(1, 0, 0, 1, 0, 0);
  A.cc.globalAlpha = Math.min(1, k) * .95;
  A.cc.fillStyle = `rgb(${VERM.join(',')})`;
  A.cc.fillRect(x, y + size * .28, size * .22, size * .22);
  A.cc.restore();
  c.fillStyle = '#211a14';
  c.font = `italic 500 ${size}px Cormorant`;
  c.letterSpacing = '1px';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(text, x + size * .5, y + size * .45);
  c.restore();
}
