import React, { useState, useRef, useEffect } from 'react';

interface PokemonEmulatorProps {
  src?: string;
}

export const PokemonEmulator: React.FC<PokemonEmulatorProps> = ({ 
  src = '/programs/pokemon/index.html' 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pressedKeys, setPressedKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const getMappedKeyName = (key: string) => {
      const map: Record<string, string> = {
        'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
        'z': 'b', 'Z': 'b', 'x': 'a', 'X': 'a',
        'Shift': 'select', 'Enter': 'start', 's': 'save', 'S': 'save', 'l': 'load', 'L': 'load'
      };
      return map[key];
    };

    const handleKeyChange = (e: KeyboardEvent, isDown: boolean) => {
      const keyName = getMappedKeyName(e.key);
      if (keyName) {
        setPressedKeys(prev => ({ ...prev, [keyName]: isDown }));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => handleKeyChange(e as any, true);
    const onKeyUp = (e: KeyboardEvent) => handleKeyChange(e as any, false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const iframe = iframeRef.current;
    let attachIframeListener: () => void;
    if (iframe) {
      attachIframeListener = () => {
        try {
          const doc = iframe.contentWindow?.document;
          if (doc) {
            doc.addEventListener('keydown', onKeyDown);
            doc.addEventListener('keyup', onKeyUp);
          }
        } catch (err) {}
      };
      iframe.addEventListener('load', attachIframeListener);
      attachIframeListener();
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      try {
        if (iframe && iframe.contentWindow?.document) {
          iframe.contentWindow.document.removeEventListener('keydown', onKeyDown);
          iframe.contentWindow.document.removeEventListener('keyup', onKeyUp);
        }
        if (iframe && attachIframeListener) {
          iframe.removeEventListener('load', attachIframeListener);
        }
      } catch (e) {}
    };
  }, []);

  const sendKeyEvent = (type: 'keydown' | 'keyup', key: string, code: string, keyCode: number) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeWin = iframe.contentWindow;
      if (!iframeWin) return;

      iframe.focus();

      const event = new (iframeWin as any).KeyboardEvent(type, {
        key,
        code,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      });

      iframeWin.dispatchEvent(event);
      const doc = iframeWin.document;
      if (doc) {
        doc.dispatchEvent(event);
        const target = doc.activeElement || doc.body;
        if (target) {
          target.dispatchEvent(event);
        }
      }
    } catch (err) {
      console.warn('Could not dispatch key event to emulator iframe:', err);
    }
  };

  const handlePress = (keyName: string, key: string, code: string, keyCode: number) => {
    setPressedKeys(prev => ({ ...prev, [keyName]: true }));
    sendKeyEvent('keydown', key, code, keyCode);
  };

  const handleRelease = (keyName: string, key: string, code: string, keyCode: number) => {
    setPressedKeys(prev => ({ ...prev, [keyName]: false }));
    sendKeyEvent('keyup', key, code, keyCode);
  };

  const getButtonProps = (keyName: string, key: string, code: string, keyCode: number) => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        handlePress(keyName, key, code, keyCode);
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault();
        handleRelease(keyName, key, code, keyCode);
      },
      onPointerLeave: (e: React.PointerEvent) => {
        e.preventDefault();
        if (pressedKeys[keyName]) {
          handleRelease(keyName, key, code, keyCode);
        }
      }
    };
  };

  const restartGame = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const triggerSaveState = () => {
    handlePress('save', 's', 'KeyS', 83);
    setTimeout(() => handleRelease('save', 's', 'KeyS', 83), 100);
  };

  const triggerLoadState = () => {
    handlePress('load', 'l', 'KeyL', 76);
    setTimeout(() => handleRelease('load', 'l', 'KeyL', 76), 100);
  };

  /* Pressed / resting colors for the pill-shaped GB buttons */
  const pillBtn = (isPressed: boolean) => ({
    background: isPressed
      ? 'linear-gradient(180deg, #383838 0%, #505050 100%)'
      : 'linear-gradient(180deg, #606060 0%, #404040 100%)',
    border: `2px solid ${isPressed ? '#222' : '#333'}`,
    borderRadius: '6px',
    padding: '4px 12px',
    color: '#ccc',
    fontSize: '10px',
    fontWeight: 700 as const,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: isPressed ? 'inset 0 2px 4px rgba(0,0,0,0.6)' : '0 2px 3px rgba(0,0,0,0.4)',
    transform: isPressed ? 'translateY(1px)' : 'none',
    transition: 'all 0.08s ease',
    userSelect: 'none' as const,
    fontFamily: 'Arial, sans-serif',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#3c1e5a',
      color: '#fff',
      userSelect: 'none',
      overflow: 'hidden',
    }}>
      {/* ─── GAMEBOY SCREEN SECTION ─── */}
      <div style={{
        background: '#585858',
        borderRadius: '8px 8px 0 0',
        padding: '8px 8px 24px 8px',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Screen bezel header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 12px',
          fontSize: '9px',
          color: '#bbb',
          fontWeight: 700,
          borderBottom: '1px solid #404040',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0000', boxShadow: '0 0 5px #ff0000' }} />
            <span>POWER</span>
          </div>
          <span style={{ letterSpacing: 2 }}>DOT MATRIX WITH STEREO SOUND</span>
        </div>

        {/* Emulation display */}
        <div style={{
          width: '100%',
          aspectRatio: '10 / 9',
          maxHeight: 200,
          background: '#000',
          border: '4px solid #303030',
          overflow: 'hidden',
          margin: '0 auto',
        }}>
          <iframe
            ref={iframeRef}
            src={src}
            style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
            title="Pokémon Crystal GBC"
            sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-downloads"
          />
        </div>

        {/* GAME BOY COLOR logo */}
        <div style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontStyle: 'italic',
          fontWeight: 700,
          letterSpacing: 1,
          color: '#bbb',
          display: 'flex',
          gap: 2,
        }}>
          <span>GAME BOY </span>
          <span style={{ color: '#a81870' }}>C</span>
          <span style={{ color: '#582080' }}>O</span>
          <span style={{ color: '#1080b0' }}>L</span>
          <span style={{ color: '#88b010' }}>O</span>
          <span style={{ color: '#e08810' }}>R</span>
        </div>
      </div>

      {/* ─── GAMEBOY CONTROLS SECTION ─── */}
      <div style={{
        flex: 1,
        background: '#4c2870',
        borderRadius: '0 0 8px 8px',
        padding: '12px 12px 8px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* D-pad and A/B row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 8px' }}>
          {/* D-Pad */}
          <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
            {/* Horizontal bar */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 72, height: 22, background: '#282828', border: '1px solid #181818', borderRadius: 3 }} />
            {/* Vertical bar */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 22, height: 72, background: '#282828', border: '1px solid #181818', borderRadius: 3 }} />
            {/* Center circle */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 20, height: 20, background: '#383838', borderRadius: '50%', border: '1px solid #202020', zIndex: 1 }} />
            {/* Directional touch targets */}
            <div {...getButtonProps('up', 'ArrowUp', 'ArrowUp', 38)} style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 22, height: 26, cursor: 'pointer', zIndex: 2, background: pressedKeys['up'] ? 'rgba(0,0,0,0.4)' : 'transparent', borderRadius: '3px 3px 0 0' }} />
            <div {...getButtonProps('down', 'ArrowDown', 'ArrowDown', 40)} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 22, height: 26, cursor: 'pointer', zIndex: 2, background: pressedKeys['down'] ? 'rgba(0,0,0,0.4)' : 'transparent', borderRadius: '0 0 3px 3px' }} />
            <div {...getButtonProps('left', 'ArrowLeft', 'ArrowLeft', 37)} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 26, height: 22, cursor: 'pointer', zIndex: 2, background: pressedKeys['left'] ? 'rgba(0,0,0,0.4)' : 'transparent', borderRadius: '3px 0 0 3px' }} />
            <div {...getButtonProps('right', 'ArrowRight', 'ArrowRight', 39)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 26, height: 22, cursor: 'pointer', zIndex: 2, background: pressedKeys['right'] ? 'rgba(0,0,0,0.4)' : 'transparent', borderRadius: '0 3px 3px 0' }} />
          </div>

          {/* A and B Buttons */}
          <div style={{ display: 'flex', gap: 14, transform: 'rotate(-12deg)', marginTop: 12, marginRight: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                {...getButtonProps('b', 'z', 'KeyZ', 90)}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: pressedKeys['b'] ? '#580820' : '#881840',
                  border: '2px solid #600028',
                  boxShadow: pressedKeys['b'] ? 'inset 0 2px 4px rgba(0,0,0,0.6)' : '0 3px 4px rgba(0,0,0,0.4)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', outline: 'none',
                  transform: pressedKeys['b'] ? 'translateY(1px)' : 'none',
                  transition: 'all 0.08s ease',
                }}
              >B</button>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#bbb', marginTop: 3 }}>B</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                {...getButtonProps('a', 'x', 'KeyX', 88)}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: pressedKeys['a'] ? '#580820' : '#881840',
                  border: '2px solid #600028',
                  boxShadow: pressedKeys['a'] ? 'inset 0 2px 4px rgba(0,0,0,0.6)' : '0 3px 4px rgba(0,0,0,0.4)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', outline: 'none',
                  transform: pressedKeys['a'] ? 'translateY(1px)' : 'none',
                  transition: 'all 0.08s ease',
                }}
              >A</button>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#bbb', marginTop: 3 }}>A</span>
            </div>
          </div>
        </div>

        {/* SAVE / LOAD / RESET — styled as real GameBoy hardware buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          padding: '6px 0',
        }}>
          <button onClick={triggerSaveState} style={pillBtn(false)}>SAVE</button>
          <button onClick={triggerLoadState} style={pillBtn(false)}>LOAD</button>
          <button onClick={restartGame} style={{
            ...pillBtn(false),
            background: 'linear-gradient(180deg, #882040 0%, #601030 100%)',
            border: '2px solid #401020',
            color: '#e0c0c8',
          }}>RESET</button>
        </div>

        {/* SELECT / START */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(-12deg)' }}>
            <button
              {...getButtonProps('select', 'Shift', 'ShiftLeft', 16)}
              style={{
                width: 40, height: 10,
                background: pressedKeys['select'] ? '#303030' : '#505050',
                border: '1px solid #303030',
                borderRadius: 10,
                cursor: 'pointer', outline: 'none',
                boxShadow: pressedKeys['select'] ? 'inset 0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.3)',
                transform: pressedKeys['select'] ? 'translateY(1px)' : 'none',
                transition: 'all 0.08s ease',
              }}
            />
            <span style={{ fontSize: 7, fontWeight: 700, color: '#bbb', marginTop: 3, letterSpacing: 1 }}>SELECT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(-12deg)' }}>
            <button
              {...getButtonProps('start', 'Enter', 'Enter', 13)}
              style={{
                width: 40, height: 10,
                background: pressedKeys['start'] ? '#303030' : '#505050',
                border: '1px solid #303030',
                borderRadius: 10,
                cursor: 'pointer', outline: 'none',
                boxShadow: pressedKeys['start'] ? 'inset 0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.3)',
                transform: pressedKeys['start'] ? 'translateY(1px)' : 'none',
                transition: 'all 0.08s ease',
              }}
            />
            <span style={{ fontSize: 7, fontWeight: 700, color: '#bbb', marginTop: 3, letterSpacing: 1 }}>START</span>
          </div>
        </div>

        {/* Keyboard Guide — compact, no emojis */}
        <div style={{
          background: '#281440',
          border: '1px solid #1b0a2d',
          borderRadius: 4,
          padding: '6px 8px',
          fontSize: '9px',
          lineHeight: '1.4',
          color: '#aaa',
        }}>
          <div style={{ fontWeight: 700, color: '#d4a843', marginBottom: 3, fontSize: 10 }}>
            Keyboard Controls
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 12px' }}>
            <span><b style={{ color: '#ddd' }}>D-Pad</b> — Arrow Keys</span>
            <span><b style={{ color: '#ddd' }}>A</b> — X key</span>
            <span><b style={{ color: '#ddd' }}>B</b> — Z key</span>
            <span><b style={{ color: '#ddd' }}>Start</b> — Enter</span>
            <span><b style={{ color: '#ddd' }}>Select</b> — Shift</span>
            <span><b style={{ color: '#ddd' }}>Save</b> — S key</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonEmulator;
