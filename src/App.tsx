import React, { useState, useEffect } from 'react';
import { useWindowManager } from './wm/manager';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import Window from './components/Window';
import Notepad from './apps/Notepad';
import Calculator from './apps/Calculator';
import SoundRecorder from './apps/SoundRecorder';
import Explorer from './apps/Explorer';
import DisplayProperties from './apps/DisplayProperties';
import WebRadio from './apps/WebRadio';
import BootScreen from './components/BootScreen';
import PokemonEmulator from './apps/PokemonEmulator';
import Pong from './apps/Pong';
import AfricaOnlyTV from './apps/AfricaOnlyTV';
import VideoFolder from './apps/VideoFolder';
import VideoPlayer from './apps/VideoPlayer';
import PplsStory from './apps/PplsStory';
import PplsThreadViewer from './apps/PplsThreadViewer';
import LocalEchoTerminal from './apps/LocalEchoTerminal';
import InternetExplorer from './apps/InternetExplorer';


export const App: React.FC = () => {
  const { windows } = useWindowManager();
  const [isBooting, setIsBooting] = useState(true);
  const [powerOnClass, setPowerOnClass] = useState('');

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const W = windowSize.width;
  const H = windowSize.height;

  // CRT bezel sizing — mobile gets a very thin frame so the screen area is maximised
  // Large screens  (W >= 1400): 33px sides
  // Medium screens (1000 <= W < 1400): 28px sides
  // Small screens  (600 <= W < 1000): 12px sides
  // Mobile         (W < 600):  8px sides
  const borderX = W >= 1400 ? 33 : W >= 1000 ? 28 : W >= 600 ? 12 : 8;
  const borderY = H >= 900 ? 33 : H >= 700 ? 28 : H >= 500 ? 10 : 8;
  const borderBottom = W < 600 ? borderY * 1.2 : borderY * 1.4; // slimmer bottom chin on mobile

  const curveX = borderX * 0.2;
  const curveY = borderY * 0.2;


  const renderAppContent = (win: any) => {
    switch (win.appType) {
      case 'notepad':
        return <Notepad filePath={win.appProps?.filePath} />;
      case 'calculator':
        return <Calculator isFocused={win.focused} />;
      case 'soundrec':
        return <SoundRecorder />;
      case 'explorer':
        return <Explorer path={win.appProps?.path} windowId={win.id} />;
      case 'internet-explorer':
        return <InternetExplorer src={win.appProps?.src} windowId={win.id} />;
      case 'iframe':
        return (
          <iframe
            src={win.appProps?.src}
            className="w-full h-full border-none bg-white"
            title={win.title}
            sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-downloads"
          />
        );
      case 'display-properties':
        return <DisplayProperties />;
      case 'webradio':
        return <WebRadio />;
      case 'pokemon':
        return <PokemonEmulator src={win.appProps?.src} />;
      case 'pong':
        return <Pong />;
      case 'africaonly':
        return <AfricaOnlyTV />;
      case 'video-folder':
        return <VideoFolder collectionId={win.appProps?.collectionId} />;
      case 'ppls-story':
        return <PplsStory />;
      case 'ppls-thread-viewer':
        return <PplsThreadViewer threadId={win.appProps?.threadId} />;
      case 'ppls-local-echo':
        return <LocalEchoTerminal />;
      case 'video-player':
        return <VideoPlayer videoSrc={win.appProps?.videoSrc} videoTitle={win.appProps?.videoTitle} videoArtist={win.appProps?.videoArtist} />;
      default:
        return <div className="p-4">Unknown Application</div>;
    }
  };

  const handleBootComplete = () => {
    setIsBooting(false);
    setPowerOnClass('crt-power-on');
  };

  /* CRT monitor frame is ALWAYS visible.
     During boot: BIOS terminal renders inside the screen area.
     After boot: Desktop + windows render inside the screen area. */

  return (
    <div className="crt-wrapper">
      {/* Custom responsive SVG CRT Bezel — always present, matches dynamic size */}
      <svg className="crt-bezel-overlay" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bezel-shading" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="85%" stopColor="#e2ded6" />
            <stop offset="100%" stopColor="#a6a299" />
          </radialGradient>
        </defs>
        <path 
          d={`M 0 0 H ${W} V ${H} H 0 Z M ${borderX} ${borderY} Q ${W / 2} ${borderY - curveY} ${W - borderX} ${borderY} Q ${W - borderX + curveX} ${(H - borderBottom + borderY) / 2} ${W - borderX} ${H - borderBottom} Q ${W / 2} ${H - borderBottom + curveY} ${borderX} ${H - borderBottom} Q ${borderX - curveX} ${(H - borderBottom + borderY) / 2} ${borderX} ${borderY} Z`} 
          fill="url(#bezel-shading)" 
          fillRule="evenodd" 
        />
        <path 
          d={`M ${borderX} ${borderY} Q ${W / 2} ${borderY - curveY} ${W - borderX} ${borderY} Q ${W - borderX + curveX} ${(H - borderBottom + borderY) / 2} ${W - borderX} ${H - borderBottom} Q ${W / 2} ${H - borderBottom + curveY} ${borderX} ${H - borderBottom} Q ${borderX - curveX} ${(H - borderBottom + borderY) / 2} ${borderX} ${borderY}`} 
          fill="none" 
          stroke="#807d75" 
          strokeWidth={Math.max(1.5, borderX * 0.08)} 
        />
      </svg>

      {/* Screen Content Window — dynamic dimensions positioned to match the bezel hole */}
      <div 
        className={`crt-screen-content ${isBooting ? '' : powerOnClass}`}
        style={{
          top: borderY,
          left: borderX,
          width: W - borderX * 2,
          height: H - borderY - borderBottom,
        }}
      >
        <div className="crt-screen-vignette" />
        <div className="crt-screen-filter" />
        <div className="crt-screen-flicker" />

        {isBooting ? (
          /* BIOS boot terminal — rendered INSIDE the CRT screen */
          <BootScreen onComplete={handleBootComplete} />
        ) : (
          /* Desktop environment */
          <div className="relative w-full h-full overflow-hidden bg-[#008080]">
            <Desktop />

            {windows.map((win) => (
              <Window
                key={win.id}
                id={win.id}
                title={win.title}
                icon={win.icon}
                x={win.x}
                y={win.y}
                width={win.width}
                height={win.height}
                isMaximized={win.isMaximized}
                isMinimized={win.isMinimized}
                focused={win.focused}
                zIndex={win.zIndex}
              >
                {renderAppContent(win)}
              </Window>
            ))}

            <Taskbar />
          </div>
        )}
      </div>
    </div>
  );
};
export default App;
