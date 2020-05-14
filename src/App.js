import React, { useRef, useState, useEffect, useCallback } from 'react';
import './App.css';
import logo from './assets/images/logo/whack-a-virus.png';
import target1 from './assets/images/targets/1.png';
import target2 from './assets/images/targets/2.png';
import target3 from './assets/images/targets/3.png';
import target4 from './assets/images/targets/4.png';
import target5 from './assets/images/targets/5.png';
import target6 from './assets/images/targets/6.png';
import Button from './components/Button';
import PreLoader from './components/PreLoader';

const TIMER_MAX = 30000;
const TIMER_MAX_S = TIMER_MAX / 1000;
const DIFFICULTIES = ['easy', 'normal', 'hard'];
const TARGET_SIZE = 172;
const TARGET_SIZE_HALF = TARGET_SIZE / 2;
const TARGET_DURATION = 4000;
const TARGET_MAX_COUNT = {
  easy: 42,
  normal: 64,
  hard: 96,
};

function App() {
  const canvas = useRef();
  const aside = useRef();
  const countdownRef = useRef();
  const targetsRef = useRef();
  const timerRef = useRef();
  const difficultyRef = useRef();
  const gameIntervalRef = useRef();
  const [ctx, ctxRef] = useCtx();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState('menu');
  const [countdown, setCountdown] = useState(3);
  const [difficulty, setDifficulty] = useState('normal');
  const [targets, setTargets] = useState([]);
  const [timer, setTimer] = useState(TIMER_MAX_S);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState([]);
  const [currentDifficulty, setCurrentDifficulty] = useState('normal');

  useEffect(() => {
    setMounted(true);
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
    if (view === 'game') {
      setTimer(TIMER_MAX_S);
      setTargets([]);
      setMisses([]);
      setScore(0);
      setCurrentDifficulty(difficultyRef.current);

      const canvasWidth =
        canvas.current.clientWidth - TARGET_SIZE - aside.current.clientWidth;
      const canvasHeight = canvas.current.clientHeight - TARGET_SIZE;
      const targetMaxCount = TARGET_MAX_COUNT[difficultyRef.current];
      const targetInterval =
        Math.floor((TIMER_MAX - TARGET_DURATION) / targetMaxCount / 10) * 10;
      let lapse = 0;
      let targetCount = 0;

      function generatePosition() {
        const top = Math.floor(Math.random() * canvasHeight);
        const left = Math.floor(Math.random() * canvasWidth);
        const target = targetsRef.current.find(
          item =>
            item.top - TARGET_SIZE_HALF <= top &&
            item.top + TARGET_SIZE_HALF >= top &&
            item.left - TARGET_SIZE_HALF <= left &&
            item.left + TARGET_SIZE_HALF >= left &&
            !item.hit &&
            item.id + 4000 > lapse
        );

        if (target) {
          return generatePosition();
        }

        return { top, left };
      }

      gameIntervalRef.current = setInterval(() => {
        lapse += 10;

        if (lapse % targetInterval === 0 && targetCount !== targetMaxCount) {
          const [type, image] = getRandomImage();
          setTargets([
            ...targetsRef.current,
            {
              ...generatePosition(),
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

  function startGame() {
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
  }

  function endGame() {
    setView('ending');
    setTimeout(() => setView('results'), 2000);
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
            <img src={logo} alt="Whack a Virus" className="logo" />
            {difficultyNode}
            <div className="btns">
              <Button onClick={startGame} className="btn-green">
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
                setMisses([
                  ...misses,
                  {
                    top: e.pageY,
                    left: e.pageX,
                  },
                ]);
              }
            }}
          >
            {targets.map(target => (
              <img
                key={target.id}
                src={target.image}
                alt="target"
                className={`target target-${target.type} ${
                  target.hit ? 'hit' : ''
                }`}
                style={{ top: target.top, left: target.left }}
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
                      };

                      setTargets(newTargets);
                    }
                  } else {
                    setMisses([
                      ...misses,
                      {
                        top: pageY,
                        left: pageX,
                      },
                    ]);
                  }

                  setScore(score + 100);
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
          <aside ref={aside}>
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
              <Button className="btn-green" onClick={startGame}>
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
    <div className="app">
      <div className="main">
        <div className={`wrapper view-${view}`}>{viewNode}</div>
      </div>
      {mounted ? <PreLoader /> : null}
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

function getRandomImage() {
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
