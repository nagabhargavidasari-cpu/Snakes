/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Music } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const BOARD_SIZE = 400; // 20 * 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

const TRACKS = [
  { title: "Cybernetic Horizon", artist: "AI Synth", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { title: "Neon Grid Runner", artist: "AI Synth", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { title: "Digital Afterglow", artist: "AI Synth", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  const directionRef = useRef(INITIAL_DIRECTION);
  const lastProcessedDirectionRef = useRef(INITIAL_DIRECTION);

  // Music State
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Game Loop
  useEffect(() => {
    if (!isGameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const currentDir = directionRef.current;
        lastProcessedDirectionRef.current = currentDir;
        
        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // Check collisions (walls)
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          handleGameOver();
          return prev;
        }

        // Check collisions (self)
        if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          handleGameOver();
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Check food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          // Generate new food avoiding snake
          let newFood;
          while (true) {
            newFood = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE)
            };
            // eslint-disable-next-line no-loop-func
            if (!newSnake.some(s => s.x === newFood.x && s.y === newFood.y)) {
              break;
            }
          }
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 70);
    return () => clearInterval(interval);
  }, [isGameStarted, gameOver, food]);

  const handleGameOver = () => {
    setGameOver(true);
    setHighScore(prev => Math.max(prev, score));
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsGameStarted(true);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    });
  };

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (!isGameStarted && e.key === ' ') {
        setIsGameStarted(true);
        // Autoplay music on first interaction if not playing
        if (!isPlaying && audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
        return;
      }

      if (gameOver && e.key === ' ') {
        resetGame();
        return;
      }

      const lastDir = lastProcessedDirectionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (lastDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (lastDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (lastDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (lastDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, gameOver, isPlaying]);

  // Music Controls
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => {
        console.log("Audio play failed:", e);
        setIsPlaying(false);
      });
    }
  }, [currentTrack]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipNext = () => {
    setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const skipPrev = () => {
    setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    skipNext();
  };

  return (
    <div className="flex flex-col h-screen w-full font-mono text-[#e0e0e0] bg-[#050505] overflow-hidden relative z-10">
      {/* Header */}
      <header className="h-[60px] border-b-2 border-[#00f3ff] flex items-center justify-between px-10 bg-[#111111] shadow-[0_0_20px_rgba(0,243,255,0.2)] shrink-0">
        <h1 className="text-2xl text-[#00f3ff] uppercase tracking-[4px] drop-shadow-[0_0_10px_#00f3ff] font-bold">
          NEON-VIPER // PROTOCOL_M
        </h1>
        <div className="flex gap-5 text-sm">
          <span>SYS_TEMP: 42°C</span>
          <span className="text-[#bcff00]">SYNC_ACTIVE</span>
        </div>
      </header>

      {/* Main Layout */}
      <main className="grid grid-cols-[280px_1fr_280px] flex-1 gap-[2px] bg-[#00f3ff] min-h-0">
        {/* Left Panel */}
        <aside className="bg-[#050505] p-5 flex flex-col gap-5 overflow-y-auto">
          <div className="border border-[#333] p-4 text-center">
            <div className="text-[10px] uppercase opacity-60 mb-1">Score</div>
            <div className="text-2xl text-[#ff00ff] font-bold">{score.toString().padStart(6, '0')}</div>
          </div>
          <div className="border border-[#333] p-4 text-center">
            <div className="text-[10px] uppercase opacity-60 mb-1">High Score</div>
            <div className="text-sm text-[#e0e0e0] font-bold">{highScore.toString().padStart(6, '0')}</div>
          </div>
          <div className="mt-auto text-[10px] text-[#555] leading-relaxed">
            [WASD] TO NAVIGATE<br/>
            [SPACE] TO START/PAUSE PROTOCOL
          </div>
        </aside>

        {/* Center Panel */}
        <section className="bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
          <div
            className="game-grid-bg border-2 border-[#ff00ff] relative shadow-[0_0_30px_rgba(255,0,255,0.15)]"
            style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
          >
            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              const trailFactor = index / snake.length;
              return (
                <div
                  key={index}
                  className="absolute bg-[#bcff00] rounded-[2px]"
                  style={{
                    left: segment.x * CELL_SIZE,
                    top: segment.y * CELL_SIZE,
                    width: CELL_SIZE - 2,
                    height: CELL_SIZE - 2,
                    border: isHead ? '1px solid white' : 'none',
                    zIndex: isHead ? 10 : 5,
                    opacity: Math.max(0.15, 1 - trailFactor * 0.85),
                    transform: `scale(${Math.max(0.4, 1 - trailFactor * 0.6)})`,
                    boxShadow: isHead 
                      ? '0 0 12px #bcff00, 0 0 20px #bcff00' 
                      : `0 0 ${8 - trailFactor * 6}px #bcff00`
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="absolute bg-[#ff00ff] rounded-full shadow-[0_0_12px_#ff00ff]"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                zIndex: 5
              }}
            />

            {/* Overlays */}
            {!isGameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                <div className="text-center animate-pulse">
                  <p className="text-[#00f3ff] text-lg uppercase tracking-widest mb-2">Press SPACE to Start</p>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
                <div className="text-center">
                  <h2 className="text-3xl font-bold uppercase text-[#ff00ff] mb-2 drop-shadow-[0_0_10px_#ff00ff]">Protocol Failed</h2>
                  <button
                    onClick={resetGame}
                    className="mt-4 bg-transparent border border-[#00f3ff] text-[#00f3ff] px-4 py-2 uppercase text-xs hover:bg-[#00f3ff] hover:text-[#050505] hover:shadow-[0_0_15px_#00f3ff] transition-all"
                  >
                    Reboot Sequence
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-5 text-[#00f3ff] text-xs uppercase">
            VIRTUAL ENVIRONMENT STABLE // SECTOR 7-G
          </div>
        </section>

        {/* Right Panel */}
        <aside className="bg-[#050505] p-5 flex flex-col overflow-y-auto">
          <div className="text-[10px] uppercase opacity-60 mb-2">Audio Matrix</div>
          <div className="flex flex-col gap-2">
            {TRACKS.map((track, idx) => (
              <div
                key={idx}
                onClick={() => { setCurrentTrack(idx); setIsPlaying(true); }}
                className={`p-2 border text-[13px] cursor-pointer transition-colors ${
                  currentTrack === idx
                    ? 'border-[#bcff00] text-[#bcff00]'
                    : 'border-[#333] text-[#e0e0e0] hover:border-[#666]'
                }`}
              >
                <div className={`font-bold ${currentTrack === idx ? 'text-[#bcff00]' : 'text-[#00f3ff]'}`}>{track.title}</div>
                <div className="text-xs opacity-70">{track.artist}</div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <div className="text-[10px] uppercase opacity-60 mb-2">Visualizer</div>
            <div className={`flex items-end gap-[2px] h-[60px] ${isPlaying ? 'is-playing' : ''}`}>
              {[1, 2, 3, 4, 5, 6].map((bar) => (
                <div key={bar} className="visualizer-bar" style={{ height: isPlaying ? undefined : '10%' }}></div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer / Music Player */}
      <footer className="h-[120px] bg-[#111111] border-t-2 border-[#00f3ff] grid grid-cols-[300px_1fr_300px] items-center px-10 shrink-0">
        <div className="flex flex-col">
          <span className="text-[#00f3ff] font-bold">{TRACKS[currentTrack].title}</span>
          <span className="text-xs opacity-70">{TRACKS[currentTrack].artist}</span>
          <div className="h-1 bg-[#222] w-full mt-2 relative">
            <div className="h-full bg-[#00f3ff] shadow-[0_0_10px_#00f3ff] w-[65%] animate-pulse"></div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-8">
          <button
            onClick={skipPrev}
            className="bg-transparent border border-[#00f3ff] text-[#00f3ff] px-4 py-2 uppercase text-xs transition-all hover:bg-[#00f3ff] hover:text-[#050505] hover:shadow-[0_0_15px_#00f3ff]"
          >
            Prev
          </button>
          <button
            onClick={togglePlay}
            className="bg-transparent border border-[#00f3ff] text-[#00f3ff] px-6 py-2 uppercase text-xs transition-all hover:bg-[#00f3ff] hover:text-[#050505] hover:shadow-[0_0_15px_#00f3ff] active:bg-[#00f3ff] active:text-[#050505]"
            style={isPlaying ? { background: '#00f3ff', color: '#050505', boxShadow: '0 0 15px #00f3ff' } : {}}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={skipNext}
            className="bg-transparent border border-[#00f3ff] text-[#00f3ff] px-4 py-2 uppercase text-xs transition-all hover:bg-[#00f3ff] hover:text-[#050505] hover:shadow-[0_0_15px_#00f3ff]"
          >
            Next
          </button>
        </div>

        <div className="text-right text-sm flex items-center justify-end gap-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-[#00f3ff] hover:text-[#bcff00] transition-colors"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 accent-[#00f3ff] h-1 bg-[#222] appearance-none cursor-pointer"
          />
        </div>
      </footer>
      <audio 
        ref={audioRef} 
        src={TRACKS[currentTrack].url} 
        onEnded={handleTrackEnd}
        preload="auto"
      />
    </div>
  );
}
