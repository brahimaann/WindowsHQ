import React, { useEffect, useState, useRef } from 'react';
import { useWindowManager, AppType } from '../wm/manager';

export const Taskbar: React.FC = () => {
  const {
    windows,
    startMenuOpen,
    setStartMenuOpen,
    openWindow,
    focusWindow,
    minimizeWindow,
  } = useWindowManager();

  const [timeStr, setTimeStr] = useState('');
  const startMenuRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const hoursStr = hours.toString().padStart(2, '0');
      setTimeStr(`${hoursStr}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close start menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        startMenuOpen &&
        startMenuRef.current &&
        !startMenuRef.current.contains(e.target as Node) &&
        startButtonRef.current &&
        !startButtonRef.current.contains(e.target as Node)
      ) {
        setStartMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [startMenuOpen, setStartMenuOpen]);

  const handleStartButtonClick = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const handleTaskClick = (id: string, focused: boolean, isMinimized: boolean) => {
    if (focused && !isMinimized) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  };

  const launchApp = (
    id: string,
    title: string,
    appType: AppType,
    icon: string,
    width = 400,
    height = 300,
    props: any = {}
  ) => {
    openWindow({
      id,
      title,
      appType,
      icon,
      width,
      height,
      appProps: props,
    });
    setStartMenuOpen(false);
  };

  return (
    <div className="taskbar absolute bottom-0 left-0 right-0 h-[30px] flex items-center bg-[#c0c0c0] border-t-2 border-white select-none z-[99999]">
      {/* Start Button */}
      <button
        ref={startButtonRef}
        onClick={handleStartButtonClick}
        className={`start-button flex items-center h-[22px] px-1 m-[2px] font-bold text-black border-2 outline-none ${
          startMenuOpen ? 'border-inset bg-[#e0e0e0]' : 'border-outset'
        }`}
        style={{ borderStyle: 'solid' }}
      >
        <img
          src="/images/start-logo.png"
          alt="WinLogo"
          className="w-4 h-4 mr-1 image-render-pixelated"
        />
        Start
      </button>

      <div className="taskbar-divider h-5 w-[2px] mx-1 border-l border-gray-600 border-r border-white" />

      {/* Tasks list */}
      <div className="tasks flex flex-1 h-[24px] overflow-hidden items-center">
        {windows.map((win) => (
          <button
            key={win.id}
            onClick={() => handleTaskClick(win.id, win.focused, win.isMinimized)}
            className={`task flex items-center h-[22px] max-w-[150px] flex-1 px-1 m-[1px] text-xs text-black border-2 overflow-hidden text-ellipsis whitespace-nowrap outline-none ${
              win.focused && !win.isMinimized
                ? 'font-bold border-inset bg-[#dfdfdf] shadow-inner'
                : 'border-outset'
            }`}
            style={{ borderStyle: 'solid' }}
          >
            {win.icon && (
              <img
                src={win.icon}
                alt=""
                className="w-4 h-4 mr-1 image-render-pixelated flex-shrink-0"
              />
            )}
            <span className="truncate">{win.title}</span>
          </button>
        ))}
      </div>

      <div className="taskbar-divider h-5 w-[2px] mx-1 border-l border-gray-600 border-r border-white" />

      {/* Tray */}
      <div
        className="tray flex items-center h-[22px] px-2 m-[2px] bg-[#c0c0c0] border-2 border-inset text-xs text-black"
        style={{ borderStyle: 'solid', borderColor: '#808080 #fff #fff #808080' }}
      >
        <img
          src="/images/icons/speaker-16x16.png"
          alt="Volume"
          className="w-4 h-4 mr-2 image-render-pixelated"
        />
        <span className="taskbar-time">{timeStr}</span>
      </div>

      {/* Start Menu */}
      {startMenuOpen && (
        <div
          ref={startMenuRef}
          className="start-menu absolute left-1 bottom-[30px] w-[240px] flex bg-[#c0c0c0] border-2 border-outset z-[1000000] text-black"
          style={{ borderStyle: 'solid' }}
        >
          {/* Side Logo bar */}
          <div className="start-menu-titlebar w-[30px]" />

          {/* Menu Items */}
          <ul className="flex-1 list-none p-1 m-0 text-xs">
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('explorer-c', 'My Computer', 'explorer', '/images/icons/my-computer-16x16.png', 640, 480, { path: 'C:/' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/my-computer-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>My Computer</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('network', 'Network Neighborhood', 'explorer', '/images/icons/network-16x16.png', 640, 480, { path: 'C:/Network Neighborhood' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/network-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Network Neighborhood</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('explorer-docs', 'My Documents', 'explorer', '/images/icons/my-documents-16x16.png', 640, 480, { path: 'C:/My Documents' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/my-documents-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>My Documents</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('notepad', 'Untitled - Notepad', 'notepad', '/images/icons/notepad-16x16.png', 480, 360)}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/notepad-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Notepad</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('calculator', 'Calculator', 'calculator', '/images/icons/calculator-16x16.png', 260, 260)}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/calculator-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Calculator</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('soundrec', 'Sound - Sound Recorder', 'soundrec', '/images/icons/speaker-16x16.png', 280, 160)}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/speaker-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Sound Recorder</span>
              </button>
            </li>

            <hr className="my-1 border-t border-gray-400 border-b border-white" />

            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('msdos', 'MS-DOS Prompt', 'iframe', '/images/icons/msdos-16x16.png', 640, 430, { src: '/programs/command/index.html' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/msdos-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>MS-DOS Prompt</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('minesweeper', 'Minesweeper', 'iframe', '/images/icons/minesweeper-16x16.png', 280, 345, { src: '/programs/minesweeper/index.html' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/minesweeper-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Minesweeper</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('solitaire', 'Solitaire', 'iframe', '/images/icons/solitaire-16x16.png', 585, 410, { src: '/programs/js-solitaire/index.html' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/solitaire-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Solitaire</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('pinball', '3D Pinball for Windows - Space Cadet', 'iframe', '/images/icons/pinball-16x16.png', 600, 440, { src: '/programs/pinball/space-cadet.html' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/pinball-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>3D Pinball</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('paint', 'untitled - Paint', 'iframe', '/images/icons/paint-16x16.png', 800, 600, { src: '/programs/jspaint/index.html' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/paint-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Paint</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('pokemon', 'Pokémon Crystal', 'pokemon', '/images/icons/solitaire-16x16.png', 340, 580, { src: '/programs/pokemon/index.html' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/solitaire-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Pokémon Crystal</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('powder-toy', 'Sandspiel (Powder)', 'iframe', '/images/icons/pipes-16x16.png', 800, 600, { src: 'https://sandspiel.club/' })}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/pipes-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Sandspiel (Powder)</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('webradio', 'MRND Web Radio', 'webradio', '/images/icons/speaker-16x16.png', 280, 320)}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/speaker-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>MRND Web Radio</span>
              </button>
            </li>
            <li className="hover:bg-[#000080] hover:text-white group">
              <button
                onClick={() => launchApp('display-properties', 'Display Properties', 'display-properties', '/images/icons/themes-16x16.png', 360, 400)}
                className="w-full text-left py-1 px-2 flex items-center"
              >
                <img
                  src="/images/icons/themes-32x32.png"
                  alt=""
                  className="w-6 h-6 mr-3 image-render-pixelated"
                />
                <span>Display Properties</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
export default Taskbar;
