import { useEffect, useId, useImperativeHandle, useRef } from 'react';
import './CatAvatar.css';

const moodNames = {
  sleepy: '편안하게 쉬는',
  content: '여유롭게 바라보는',
  watchful: '귀를 쫑긋 세운',
  worried: '조심스럽게 살펴보는',
};
const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A small layered illustration. All movement ends after the interaction. */
export default function CatAvatar({ mood, ref }) {
  const root = useRef(null);
  const motions = useRef([]);
  const lookFrame = useRef(null);
  const turn = useRef(0);
  const id = useId().replace(/:/g, '');
  const paint = name => `url(#${id}-${name})`;

  const stop = () => {
    motions.current.forEach(animation => animation.cancel());
    motions.current = [];
  };
  useEffect(() => () => {
    stop();
    cancelAnimationFrame(lookFrame.current);
  }, []);

  const pet = () => {
    stop();
    if (prefersStill()) return;
    const play = (selector, frames, duration = 1000) => {
      root.current.querySelectorAll(selector).forEach(node => {
        const base = getComputedStyle(node).transform;
        const relativeFrames = frames.map(frame => frame.transform && base !== 'none'
          ? { ...frame, transform: `${base} ${frame.transform}` }
          : frame);
        motions.current.push(node.animate(relativeFrames, { duration, easing: 'cubic-bezier(.22,1,.36,1)' }));
      });
    };
    const wave = turn.current++ % 3 === 2;
    play('.moa-head', [
      { transform: 'translateY(0) rotate(0)' },
      { transform: 'translateY(3px) rotate(-6deg)', offset: .28 },
      { transform: 'translateY(1px) rotate(3deg)', offset: .62 },
      { transform: 'translateY(0) rotate(0)' },
    ]);
    play('.moa-tail', [
      { transform: 'rotate(0)' }, { transform: 'rotate(-9deg)', offset: .25 },
      { transform: 'rotate(5deg)', offset: .6 }, { transform: 'rotate(0)' },
    ], 1150);
    play('.moa-ear-right', [
      { transform: 'rotate(0)' }, { transform: 'rotate(10deg)', offset: .3 },
      { transform: 'rotate(-3deg)', offset: .6 }, { transform: 'rotate(0)' },
    ], 900);
    if (mood !== 'sleepy') {
      play('.moa-eyes-open', [{ opacity: 1 }, { opacity: 0, offset: .12 }, { opacity: 0, offset: .8 }, { opacity: 1 }]);
      play('.moa-eyes-closed', [{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .8 }, { opacity: 0 }]);
    }
    play('.moa-front-paw', wave ? [
      { transform: 'translateY(0) rotate(0)' },
      { transform: 'translate(0,-19px) rotate(-18deg)', offset: .3 },
      { transform: 'translate(0,-18px) rotate(-4deg)', offset: .6 },
      { transform: 'translateY(0) rotate(0)' },
    ] : [
      { transform: 'translateY(0)' }, { transform: 'translateY(3px)', offset: .25 },
      { transform: 'translateY(-2px)', offset: .55 }, { transform: 'translateY(0)' },
    ]);
    play('.moa-heart', [
      { opacity: 0, transform: 'translateY(5px) scale(.7)' },
      { opacity: .9, transform: 'translateY(-1px) scale(1)', offset: .25 },
      { opacity: 0, transform: 'translateY(-14px) scale(.9)' },
    ], 1200);
  };
  useImperativeHandle(ref, () => ({ pet }));

  const look = event => {
    if (event.pointerType !== 'mouse' || prefersStill()) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 5;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 3;
    cancelAnimationFrame(lookFrame.current);
    lookFrame.current = requestAnimationFrame(() => {
      root.current?.style.setProperty('--look-x', `${x}px`);
      root.current?.style.setProperty('--look-y', `${y}px`);
    });
  };
  const resetLook = () => {
    cancelAnimationFrame(lookFrame.current);
    root.current?.style.setProperty('--look-x', '0px');
    root.current?.style.setProperty('--look-y', '0px');
  };

  return <button ref={root} className={`moa-button ${mood}`} type="button"
    aria-label={`${moodNames[mood]} 고양이 모아 쓰다듬기`}
    onClick={pet} onPointerMove={look} onPointerLeave={resetLook} onBlur={resetLook}>
    <svg className="moa-art" viewBox="0 0 240 208" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-fur`} cx=".34" cy=".21" r=".87">
          <stop stopColor="#e3dcea" /><stop offset=".47" stopColor="#c9bdd8" /><stop offset=".83" stopColor="#ad9cbe" /><stop offset="1" stopColor="#9583a8" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx=".4" cy=".3" r=".8">
          <stop stopColor="#faf6f2" /><stop offset=".65" stopColor="#f1e9e7" /><stop offset="1" stopColor="#d9ccd5" />
        </radialGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor="#c7b9d3" /><stop offset="1" stopColor="#9e8aae" />
        </linearGradient>
        <linearGradient id={`${id}-ear`} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#e8c7cc" /><stop offset=".55" stopColor="#d6a9b8" /><stop offset="1" stopColor="#b887a1" />
        </linearGradient>
        <radialGradient id={`${id}-iris`} cx=".4" cy=".2" r=".8">
          <stop stopColor="#b3c4bc" /><stop offset=".6" stopColor="#8aafa2" /><stop offset="1" stopColor="#547b79" />
        </radialGradient>
        <linearGradient id={`${id}-tail`} x1=".1" y1="0" x2=".7" y2="1">
          <stop stopColor="#b1a0c2" /><stop offset="1" stopColor="#d4c9df" />
        </linearGradient>
        <radialGradient id={`${id}-shade`}>
          <stop stopColor="#897198" stopOpacity=".2" /><stop offset="1" stopColor="#897198" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f9e6b9" /><stop offset=".5" stopColor="#e4c78d" /><stop offset="1" stopColor="#bc985d" />
        </linearGradient>
      </defs>

      <ellipse cx="119" cy="185" rx="80" ry="13" fill={paint('shade')} />
      <g className="moa-tail">
        <path d="M156 167c40 10 56-6 53-26-2-13-13-16-17-8-3 5 2 10 4 14 4 8-7 14-28 7" fill="none" stroke={paint('tail')} strokeWidth="20" strokeLinecap="round" />
        <path d="M194 134c-1 5 4 10 5 14" fill="none" stroke="#e2d8e9" strokeWidth="13" strokeLinecap="round" />
        <path d="M181 166l-3-9m14 6-5-9" stroke="#8e7b9e" strokeWidth="4" strokeLinecap="round" opacity=".27" />
      </g>
      <g className="moa-body">
        <path d="M69 170c-2-22 6-55 21-65 14-9 33-8 49 0 24 11 37 34 34 58-1 14-15 19-51 19-27 0-50 0-53-12Z" fill={paint('body')} />
        <path d="M84 124c10-10 29-11 40 0 11 12 15 32 12 48-15 8-35 6-48 1-7-19-12-35-4-49Z" fill={paint('face')} />
        <path d="M150 145c13 7 17 18 9 27" fill="none" stroke="#8c759f" strokeWidth="2" strokeLinecap="round" opacity=".35" />
        <ellipse cx="153" cy="175" rx="19" ry="8" fill="#b7a6c6" />
      </g>

      <g className="moa-head">
        <g className="moa-ear-left">
          <path d="M65 78C53 66 48 34 57 25c6-4 30 12 40 30Z" fill={paint('fur')} stroke="#aa98bb" strokeWidth="1" />
          <path d="M65 66c-5-11-10-30-6-32 4-2 20 10 26 20Z" fill={paint('ear')} />
          <path d="m62 48 4 14 4-5 3 6 5-5" fill="#e9ddeb" opacity=".85" />
        </g>
        <g className="moa-ear-right">
          <path d="M141 51c12-17 30-32 37-29 9 4 9 34-1 54Z" fill={paint('fur')} stroke="#a997b9" strokeWidth="1" />
          <path d="M151 52c7-9 19-20 23-20 4 1 2 19-3 31Z" fill={paint('ear')} />
          <path d="m174 46-6 16-3-6-4 6-3-6" fill="#e9ddeb" opacity=".85" />
        </g>
        <path d="M59 79c3-24 28-40 58-40 34-1 60 18 63 43l5 14-6-1 6 13-8 1c-3 27-29 43-60 43-31 0-54-14-60-36l-9-4 7-9-7-3 10-10Z" fill={paint('fur')} stroke="#ac9abb" strokeWidth=".8" />
        <path d="M117 67c-9 2-11 21-22 25-14 6-30 4-35 18 2 21 26 38 57 38 28 0 55-16 58-37-6-16-22-12-35-20-12-8-12-25-23-24Z" fill={paint('face')} />
        <path d="M75 64c11-13 25-18 38-18" fill="none" stroke="#f8f1fb" strokeWidth="3" strokeLinecap="round" opacity=".45" />
        <path d="m106 45 3 12m9-13-1 11m12-9-4 10" fill="none" stroke="#94809f" strokeWidth="3.8" strokeLinecap="round" opacity=".45" />
        <path d="m65 85 9 4m-12 5 9 3m94-12-8 4m10 6-9 3" stroke="#9d88ab" strokeWidth="3.5" strokeLinecap="round" opacity=".35" />

        <g className="moa-eyes-open">
          <g className="moa-eye-left">
            <ellipse cx="88" cy="96" rx="11.5" ry="13" fill="#564a60" />
            <ellipse cx="88" cy="97" rx="9.5" ry="11" fill={paint('iris')} />
            <g className="moa-gaze"><ellipse cx="89" cy="96" rx="5.5" ry="10" fill="#34313e" /><ellipse cx="86" cy="92" rx="3" ry="3.6" fill="#fff" /><circle cx="92" cy="102" r="1.5" fill="#fff" opacity=".65" /></g>
            <path d="M77 91c4-10 17-11 23-1" fill="none" stroke="#55445f" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="moa-eye-right">
            <ellipse cx="145" cy="95" rx="11.5" ry="13" fill="#564a60" />
            <ellipse cx="145" cy="96" rx="9.5" ry="11" fill={paint('iris')} />
            <g className="moa-gaze"><ellipse cx="145" cy="95" rx="5.5" ry="10" fill="#34313e" /><ellipse cx="142" cy="91" rx="3" ry="3.6" fill="#fff" /><circle cx="148" cy="101" r="1.5" fill="#fff" opacity=".65" /></g>
            <path d="M134 90c5-10 17-10 23 0" fill="none" stroke="#55445f" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>
        <g className="moa-eyes-closed" fill="none" stroke="#675371" strokeWidth="2.5" strokeLinecap="round">
          <path d="M78 96q10 10 20-1m37 0q10 10 20-1" />
          <path d="m78 96-2-2m78 0 2-2" strokeWidth="1.5" />
        </g>
        <g className="moa-brows" fill="none" stroke="#8a7397" strokeWidth="2.3" strokeLinecap="round">
          <path d="m78 78 13-3m51-2 13 5" />
        </g>
        <ellipse cx="72" cy="113" rx="9" ry="4" fill="#dbaeb8" opacity=".4" />
        <ellipse cx="161" cy="112" rx="9" ry="4" fill="#dbaeb8" opacity=".4" />
        <ellipse cx="108" cy="120" rx="12" ry="8" fill="#fdf8f0" />
        <ellipse cx="126" cy="120" rx="12" ry="8" fill="#fdf8f0" />
        <path d="M112 114q5-3 10 0c1 2-3 5-5 5s-6-3-5-5Z" fill="#b58396" />
        <path d="M114 114h5" stroke="#f4dce0" strokeWidth="1.1" strokeLinecap="round" />
        <path className="moa-mouth" d="M117 119v3c-3 5-8 4-10 1m10-1c2 4 7 4 10 0" fill="none" stroke="#917387" strokeWidth="1.5" strokeLinecap="round" />
        <g fill="#baa5b4"><circle cx="100" cy="119" r=".8" /><circle cx="104" cy="116" r=".8" /><circle cx="133" cy="118" r=".8" /><circle cx="130" cy="115" r=".8" /></g>
        <g className="moa-whiskers" fill="none" stroke="#99819f" strokeWidth="1.15" strokeLinecap="round" opacity=".62">
          <path d="M78 115q-20-7-32-5m31 10-26 3m104-9q21-8 33-4m-32 9 26 2" />
        </g>
      </g>

      <g className="moa-charm">
        <path d="M101 149q15 7 28-1" fill="none" stroke="#94829f" strokeWidth="2.5" />
        <circle cx="116" cy="153" r="6" fill={paint('gold')} stroke="#f6e5b9" strokeWidth="1" />
        <path d="m116 149 .8 2.8 2.7 1-2.7 1-.8 2.8-.8-2.8-2.7-1 2.7-1Z" fill="#fff3cd" />
      </g>
      <g className="moa-back-paw">
        <path d="M118 171c-1-10 2-15 9-15 8 0 12 7 11 16 0 6-5 10-12 10-6 0-9-4-8-11Z" fill={paint('face')} stroke="#c5b3c6" strokeWidth=".8" />
        <path d="m124 177 0 4m6-5v5" stroke="#cbb8c9" strokeWidth="1" strokeLinecap="round" />
      </g>
      <g className="moa-front-paw">
        <path d="M87 170c-1-12 3-19 10-19 8 0 12 7 12 19 0 8-5 12-12 12s-11-4-10-12Z" fill={paint('face')} stroke="#c5b3c6" strokeWidth=".8" />
        <path d="m93 176v5m6-5v5" stroke="#cbb8c9" strokeWidth="1" strokeLinecap="round" />
      </g>
      <g className="moa-heart" fill="#d5a6bb"><path d="M190 44c-8-6-15 3-9 9l9 8 9-8c6-6-1-15-9-9Z" /><path d="m46 68 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#d9bf91" /></g>
      <g className="moa-sleep" fill="none" stroke="#b3a3c2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M185 56h9l-9 10h9m7-25h12l-12 13h12" />
      </g>
    </svg>
    <span className="moa-caption" aria-hidden="true">모아 <span>· 쓰다듬어 주세요</span></span>
  </button>;
}
