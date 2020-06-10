import React, { useRef, useState, useEffect, useCallback } from 'react';

import './App.css';

import logo1x from './assets/images/logo/training-mode-virus-edition-1x.png';
import logo2x from './assets/images/logo/training-mode-virus-edition-2x.png';
import logo3x from './assets/images/logo/training-mode-virus-edition-3x.png';
import target1 from './assets/images/targets/1.png';
import target2 from './assets/images/targets/2.png';
import target3 from './assets/images/targets/3.png';
import target4 from './assets/images/targets/4.png';
import target5 from './assets/images/targets/5.png';
import target6 from './assets/images/targets/6.png';
import splat from './assets/images/targets/splat.gif';
import Button from './components/Button';
import PreLoader from './components/PreLoader';
import Warning from './components/Warning';

import { trackEventOnGA } from './lib/google-analytics';

const ANALYTICS_LABEL = 'Razer Mouse Accuracy Game';
const TIMER_MAX = 30000;
const TIMER_MAX_S = TIMER_MAX / 1000;
const DIFFICULTIES = ['easy', 'normal', 'hard'];
const TARGET_DURATION = 4000;
const TARGET_HIT_FADE_DURATION = 700;
const DIFFICULTY_PROPS = {
  easy: {
    targetSize: 150,
    targetMaxCount: 42,
    targetScore: 100,
  },
  normal: {
    targetSize: 125,
    targetMaxCount: 64,
    targetScore: 200,
  },
  hard: {
    targetSize: 100,
    targetMaxCount: 96,
    targetScore: 300,
  },
};

function App() {
  const canvas = useRef();
  const countdownRef = useRef();
  const targetsRef = useRef();
  const timerRef = useRef();
  const difficultyRef = useRef();
  const gameIntervalRef = useRef();
  const scoreRef = useRef();
  const [ctx, ctxRef] = useCtx();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState('menu');
  const [countdown, setCountdown] = useState(3);
  const [difficulty, setDifficulty] = useState('normal');
  const [targets, setTargets] = useState([]);
  const [targetSize, setTargetSize] = useState(0);
  const [timer, setTimer] = useState(TIMER_MAX_S);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState([]);
  const [currentDifficulty, setCurrentDifficulty] = useState('normal');

  useEffect(() => {
    if (document.readyState === 'complete') {
      setMounted(true);
    } else {
      window.addEventListener('load', () => setMounted(true));
    }
  }, []);

  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    // Game logic
    if (view === 'game') {
      setTimer(TIMER_MAX_S);
      setTargets([]);
      setMisses([]);
      setScore(0);
      setCurrentDifficulty(difficultyRef.current);

      const diffProps = DIFFICULTY_PROPS[difficultyRef.current];
      const tSize = diffProps.targetSize;

      setTargetSize(tSize);

      const canvasWidth = canvas.current.clientWidth - tSize;
      const canvasHeight = canvas.current.clientHeight - tSize;
      const { targetMaxCount } = diffProps;
      const targetInterval =
        Math.floor((TIMER_MAX - TARGET_DURATION / 2) / targetMaxCount / 10) *
        10;
      let lapse = 0;
      let targetCount = 0;

      function generatePosition(currentDate) {
        const top = Math.floor(Math.random() * canvasHeight);
        const left = Math.floor(Math.random() * canvasWidth);

        // Make sure generated position is not taken
        const positionTaken =
          targetsRef.current.findIndex(
            item =>
              item.top - tSize <= top &&
              item.top + tSize >= top &&
              item.left - tSize <= left &&
              item.left + tSize >= left &&
              (!item.hit || // Targets that are not hit
                item.hitAt + TARGET_HIT_FADE_DURATION > currentDate) && // Targets that are hit but still animating
              item.id + TARGET_DURATION > lapse // Targets that just spawned
          ) !== -1;

        if (positionTaken) {
          return generatePosition(currentDate);
        }

        return { top, left };
      }

      gameIntervalRef.current = setInterval(() => {
        // Stop timer when window is not on focus
        if (!document.hasFocus()) {
          return;
        }

        lapse += 10;

        if (lapse % targetInterval === 0 && targetCount !== targetMaxCount) {
          const [type, image] = getRandomTarget();

          setTargets([
            ...targetsRef.current,
            {
              ...generatePosition(Date.now()),
              type,
              image,
              id: lapse,
              hit: false,
            },
          ]);
          targetCount += 1;
        }

        if (lapse % 1000 === 0) {
          setTimer(timerRef.current - 1);
        }

        if (lapse === TIMER_MAX) {
          clearInterval(gameIntervalRef.current);
          endGame();
        }
      }, 10);
    } else {
      clearInterval(gameIntervalRef.current);
    }
  }, [view]);

  function startGame(restart) {
    setView('starting');

    const interval = setInterval(() => {
      const newCountdown = countdownRef.current - 1;

      if (newCountdown === 0) {
        clearInterval(interval);
        setView('game');
        setCountdown(3);

        return;
      }

      setCountdown(newCountdown);
    }, 1000);

    trackEventOnGA({
      action: `game_${!restart ? '' : 're'}start`,
      label: `${ANALYTICS_LABEL} - ${difficultyRef.current}`,
    });
  }

  function endGame(manual) {
    setView('ending');
    setTimeout(() => setView('results'), 2000);

    trackEventOnGA({
      action: `game_end_${!manual ? 'auto' : 'manual'}`,
      label: `${ANALYTICS_LABEL} - ${difficultyRef.current}`,
      value: scoreRef.current,
    });
  }

  const difficultyNode = (
    <>
      <div className="label">Difficulty</div>
      <div className="tabs">
        {DIFFICULTIES.map(item => (
          <button
            key={item}
            className={item === difficulty ? 'active' : ''}
            onClick={() => setDifficulty(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </>
  );
  let viewNode;

  switch (view) {
    case 'menu': {
      viewNode = (
        <>
          <div className="container">
            <img
              src={logo1x}
              srcSet={`${logo3x} 3x, ${logo2x} 2x, ${logo1x} 1x`}
              alt="Training Mode: Virus Edition"
              className="logo"
              draggable={false}
            />
            {difficultyNode}
            <div className="btns">
              <Button onClick={() => startGame(false)} className="btn-green">
                Start Game
              </Button>
            </div>
          </div>
        </>
      );
      break;
    }

    case 'starting':
      viewNode = (
        <>
          <div className="container">
            <div className="helper">Game starting in...</div>
            <div className="count">{countdown}</div>
          </div>
        </>
      );
      break;

    case 'game':
      viewNode = (
        <>
          <canvas
            ref={ctxRef}
            style={{
              display: 'none',
              pointerEvents: 'none',
              position: 'absolute',
            }}
          ></canvas>
          <div
            ref={canvas}
            className="canvas"
            onMouseDown={e => {
              if (!e.target.closest('.target')) {
                const canvasRect = canvas.current.getBoundingClientRect();

                setMisses([
                  ...misses,
                  {
                    top: e.pageY - canvasRect.top,
                    left: e.pageX - canvasRect.left,
                  },
                ]);
              }
            }}
          >
            {targets.map(target => (
              <img
                key={target.id}
                src={!target.hit ? target.image : splat}
                alt="target"
                className={`target target-${target.type} ${
                  target.hit ? 'hit' : ''
                }`}
                style={{
                  top: target.top,
                  left: target.left,
                  width: targetSize,
                  height: targetSize,
                }}
                draggable={false}
                onMouseDown={e => {
                  const { pageX, pageY } = e;
                  const rect = e.target.getBoundingClientRect();
                  const x = pageX - rect.x;
                  const y = pageY - rect.y;

                  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                  ctx.canvas.width = rect.width;
                  ctx.canvas.height = rect.height;

                  ctx.drawImage(e.target, 0, 0, rect.width, rect.height);
                  const alpha = ctx.getImageData(x, y, 1, 1).data[3];

                  if (alpha !== 0) {
                    const index = targets.findIndex(
                      item => item.id === target.id
                    );

                    if (index > -1) {
                      const newTargets = [...targets];

                      newTargets[index] = {
                        ...target,
                        hit: true,
                        hitAt: Date.now(),
                      };

                      setTargets(newTargets);
                    }
                  } else {
                    const canvasRect = canvas.current.getBoundingClientRect();

                    setMisses([
                      ...misses,
                      {
                        top: pageY - canvasRect.top,
                        left: pageX - canvasRect.left,
                      },
                    ]);
                  }

                  setScore(score + DIFFICULTY_PROPS[difficulty].targetScore);
                }}
              />
            ))}
            {misses.map((miss, index) => (
              <div
                key={index}
                className="miss"
                style={{ top: miss.top, left: miss.left }}
              >
                ✕
              </div>
            ))}
          </div>
          <aside>
            <div />
            <div className="stats">
              <div className="label">Timer</div>
              <div className="value timer">{timer}</div>
              <div className="label">Score</div>
              <div className="value">{score}</div>
            </div>
            <Button className="btn-red" onClick={endGame}>
              End Game
            </Button>
          </aside>
        </>
      );
      break;

    case 'ending':
      viewNode = (
        <>
          <div className={`container ${countdown <= 1 ? 'hide' : ''}`}>
            <div className="count">Times up!</div>
          </div>
        </>
      );
      break;

    case 'results': {
      const missesLen = misses.length;
      const targetsLen = targets.length;
      const hitsLen = targets.filter(item => item.hit).length;
      const clicksLen = hitsLen + missesLen;

      viewNode = (
        <>
          <div className="container">
            <div className="stats-container">
              <div className="stats">
                <div className="item">
                  <div className="title">Target Efficiency</div>
                  <div className="info">
                    <div className="value">
                      {Math.round((hitsLen / targetsLen) * 100) || 0}%
                    </div>
                    <div className="desc">
                      {hitsLen}/{targetsLen} Total
                      <br />
                      Hits/Targets
                    </div>
                  </div>
                </div>
                <div className="item">
                  <div className="title">Click Accuracy</div>
                  <div className="info">
                    <div className="value">
                      {Math.round((hitsLen / clicksLen) * 100) || 0}%
                    </div>
                    <div className="desc">
                      {hitsLen}/{clicksLen} Total
                      <br />
                      Hits/Clicks
                    </div>
                  </div>
                </div>
                <div className="item">
                  <div className="title">Total Score</div>
                  <div className="info">
                    <div className="value">{score}</div>
                    <div className="desc">
                      {currentDifficulty}
                      <br />
                      Difficulty
                    </div>
                  </div>
                </div>
              </div>
              <div className="social">
                <div className="label">Share with friends</div>
                <div className="items">
                  <button className="facebook" />
                  <button className="youtube" />
                  <button className="twitch" />
                </div>
              </div>
            </div>
          </div>
          <div className="footer">
            {difficultyNode}
            <div className="btns">
              <Button className="btn-green" onClick={() => startGame(true)}>
                <span className="icon-restart"></span>
                Restart
              </Button>
            </div>
          </div>
        </>
      );
      break;
    }

    default:
      viewNode = null;
  }

  return (
    <div className={`app ${mounted ? 'show' : ''}`}>
      <div className="main">
        <div className={`wrapper view-${view}`}>{viewNode}</div>
      </div>
      {mounted ? <PreLoader /> : null}
      <Warning />
    </div>
  );
}

export default App;

function useCtx() {
  const [ctx, setCtx] = useState(null);
  const ref = useCallback(node => {
    if (node !== null) {
      setCtx(node.getContext('2d'));
    }
  }, []);
  return [ctx, ref];
}

function getRandomTarget() {
  const randomNum = Math.floor(Math.random() * 6);
  let image;

  switch (randomNum) {
    case 0:
      image = target1;
      break;

    case 1:
      image = target2;
      break;

    case 2:
      image = target3;
      break;

    case 3:
      image = target4;
      break;

    case 4:
      image = target5;
      break;

    default:
      image = target6;
  }

  return [randomNum, image];
}
