import React, { useState, useEffect, useRef } from 'react';
import { useWindowManager, AppType } from '../wm/manager';
import { vfs } from '../vfs/fs';

interface DesktopIconDef {
  id: string;
  title: string;
  icon: string;
  appType: AppType;
  appProps?: any;
  width?: number;
  height?: number;
}

const DEFAULT_ICONS: DesktopIconDef[] = [
  // Column 1
  { id: 'my-computer', title: 'My Computer', icon: '/images/icons/my-computer-32x32.png', appType: 'explorer', appProps: { path: 'C:/' }, width: 640, height: 485 },
  { id: 'my-documents', title: 'My Documents', icon: '/images/icons/my-documents-32x32.png', appType: 'explorer', appProps: { path: 'C:/My Documents' }, width: 640, height: 480 },
  { id: 'network', title: 'Network Neighborhood', icon: '/images/icons/network-32x32.png', appType: 'explorer', appProps: { path: 'C:/Network Neighborhood' }, width: 640, height: 480 },
  { id: 'recycle', title: 'Recycle Bin', icon: '/images/icons/recycle-bin-32x32.png', appType: 'explorer', appProps: { path: 'C:/Recycled' }, width: 640, height: 480 },
  { id: 'ie', title: 'Internet Explorer', icon: '/images/icons/internet-explorer-32x32.png', appType: 'iframe', appProps: { src: '/programs/homepage.html' }, width: 800, height: 600 },
  { id: 'paint', title: 'Paint', icon: '/images/icons/paint-32x32.png', appType: 'iframe', appProps: { src: '/programs/jspaint/index.html' }, width: 800, height: 600 },
  { id: 'notepad', title: 'Notepad', icon: '/images/icons/notepad-32x32.png', appType: 'notepad', width: 480, height: 360 },

  // Column 2
  { id: 'winamp', title: 'Winamp', icon: '/images/icons/winamp2-32x32.png', appType: 'iframe', appProps: { src: '/programs/winamp/index.html' }, width: 275, height: 348 },
  { id: 'pipes', title: '3D Pipes', icon: '/images/icons/pipes-32x32.png', appType: 'iframe', appProps: { src: '/programs/pipes/index.html#%7B%22hideUI%22%3Atrue%7D' }, width: 800, height: 600 },
  { id: 'flowerbox', title: '3D Flower Box', icon: '/images/icons/themes-32x32.png', appType: 'iframe', appProps: { src: '/programs/3D-FlowerBox/index.html' }, width: 800, height: 600 },
  { id: 'msdos', title: 'MS-DOS Prompt', icon: '/images/icons/msdos-32x32.png', appType: 'iframe', appProps: { src: '/programs/command/index.html' }, width: 640, height: 430 },
  { id: 'calculator', title: 'Calculator', icon: '/images/icons/calculator-32x32.png', appType: 'calculator', width: 260, height: 260 },
  { id: 'minesweeper', title: 'Minesweeper', icon: '/images/icons/minesweeper-32x32.png', appType: 'iframe', appProps: { src: '/programs/minesweeper/index.html' }, width: 280, height: 345 },
  { id: 'soundrec', title: 'Sound Recorder', icon: '/images/icons/speaker-32x32.png', appType: 'soundrec', width: 280, height: 160 },
  { id: 'solitaire', title: 'Solitaire', icon: '/images/icons/solitaire-32x32.png', appType: 'iframe', appProps: { src: '/programs/js-solitaire/index.html' }, width: 585, height: 410 },

  // Column 3
  { id: 'pokemon', title: 'Pokémon Crystal', icon: '/images/icons/pokeball.svg', appType: 'pokemon', appProps: { src: '/programs/pokemon/index.html' }, width: 340, height: 580 },
  { id: 'powder-toy', title: 'Sandspiel (Powder)', icon: '/images/icons/pipes-32x32.png', appType: 'iframe', appProps: { src: 'https://sandspiel.club/' }, width: 800, height: 600 },
  { id: 'webradio', title: 'MRND Web Radio', icon: '/images/icons/speaker-32x32.png', appType: 'webradio', width: 280, height: 320 },
];

export const Desktop: React.FC = () => {
  const { openWindow, wallpaper, bgColor } = useWindowManager();
  const [vfsIcons, setVfsIcons] = useState<DesktopIconDef[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  
  // Custom right click context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  const desktopRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const loadVfsDesktopFiles = () => {
    try {
      const files = vfs.readdir('C:/Desktop');
      const loaded: DesktopIconDef[] = files.map((file) => {
        const title = file.name;
        const id = `vfs-desktop-${title.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const isTxt = title.endsWith('.txt');
        const icon = isTxt ? '/images/icons/notepad-doc-32x32.png' : '/images/icons/folder-32x32.png';
        const appType = isTxt ? 'notepad' : 'explorer';
        const appProps = isTxt ? { filePath: `C:/Desktop/${title}` } : { path: `C:/Desktop/${title}` };
        return {
          id,
          title,
          icon,
          appType,
          appProps,
          width: isTxt ? 480 : 640,
          height: isTxt ? 360 : 480,
        };
      });
      setVfsIcons(loaded);
    } catch (err) {
      console.error('Failed to read C:/Desktop directory:', err);
    }
  };

  useEffect(() => {
    loadVfsDesktopFiles();
    const unsubscribe = vfs.subscribe(() => {
      loadVfsDesktopFiles();
    });
    return unsubscribe;
  }, []);

  const allIcons = [...DEFAULT_ICONS, ...vfsIcons];

  // Marquee Selection Logic / Clicking background
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    
    // Do not dismiss if clicking inside the context menu
    if (target.closest('.context-menu')) {
      return;
    }

    // Dismiss context menu
    setContextMenu(null);
    setActiveSubMenu(null);

    if (e.button !== 0) return; // Only left click
    if (target.closest('.desktop-icon') || target.closest('.start-menu') || target.closest('.taskbar')) {
      return;
    }

    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;

    setSelectedIds([]);
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setMarquee({ startX, startY, currentX: startX, currentY: startY });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentX = moveEvent.clientX - rect.left;
      const currentY = moveEvent.clientY - rect.top;
      setMarquee((prev) => prev ? { ...prev, currentX, currentY } : null);

      // Compute intersection
      const x1 = Math.min(startX, currentX);
      const x2 = Math.max(startX, currentX);
      const y1 = Math.min(startY, currentY);
      const y2 = Math.max(startY, currentY);

      const newlySelected: string[] = [];
      allIcons.forEach((icon) => {
        const element = iconRefs.current[icon.id];
        if (element) {
          const elementRect = element.getBoundingClientRect();
          const desktopRect = desktopRef.current!.getBoundingClientRect();
          const elX1 = elementRect.left - desktopRect.left;
          const elX2 = elementRect.right - desktopRect.left;
          const elY1 = elementRect.top - desktopRect.top;
          const elY2 = elementRect.bottom - desktopRect.top;

          // Check overlap
          const overlaps = !(x2 < elX1 || x1 > elX2 || y2 < elY1 || y1 > elY2);
          if (overlaps) {
            newlySelected.push(icon.id);
          }
        }
      });
      setSelectedIds(newlySelected);
    };

    const handlePointerUp = () => {
      setMarquee(null);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleIconClick = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    setActiveSubMenu(null);
    if (e.ctrlKey) {
      setSelectedIds((prev) => 
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleIconDoubleClick = (iconDef: DesktopIconDef) => {
    if (iconDef.appType === 'explorer') {
      const path = iconDef.appProps?.path || 'C:/';
      try {
        const contents = vfs.readdir(path);
        if (contents.length === 0) {
          alert('This folder is empty. Conserving energy by not opening it.');
          return;
        }
      } catch (err) {
        // ignore
      }
    }

    openWindow({
      id: iconDef.id,
      title: iconDef.title,
      appType: iconDef.appType,
      icon: iconDef.icon.replace('-32x32', '-16x16'), // Use small icon for title bar
      appProps: iconDef.appProps || {},
      width: iconDef.width || 400,
      height: iconDef.height || 300,
    });
  };

  // Right click Desktop Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    if (target.closest('.desktop-icon') || target.closest('.start-menu') || target.closest('.taskbar')) {
      return;
    }
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;

    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true
    });
  };

  const handleCreateNewFolder = () => {
    try {
      let folderName = 'New Folder';
      let i = 1;
      while (vfs.exists(`C:/Desktop/${folderName}`)) {
        i++;
        folderName = `New Folder (${i})`;
      }
      vfs.mkdir(`C:/Desktop/${folderName}`);
    } catch (err) {
      console.error(err);
    }
    setContextMenu(null);
    setActiveSubMenu(null);
  };

  const handleCreateNewTextFile = () => {
    try {
      let fileName = 'New Text Document.txt';
      let i = 1;
      while (vfs.exists(`C:/Desktop/${fileName}`)) {
        i++;
        fileName = `New Text Document (${i}).txt`;
      }
      vfs.writeFile(`C:/Desktop/${fileName}`, '');
    } catch (err) {
      console.error(err);
    }
    setContextMenu(null);
    setActiveSubMenu(null);
  };

  // Drag and Drop File Import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      vfs.writeFile(`C:/Desktop/${file.name}`, text);
    }
  };

  return (
    <div
      ref={desktopRef}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="desktop folder-view absolute left-0 top-0 w-full h-[calc(100%-30px)] p-4 flex flex-col flex-wrap content-start gap-x-1 gap-y-1 select-none overflow-hidden"
      style={{
        backgroundColor: bgColor,
        backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        touchAction: 'none', // Prevents default gestures like pinch-to-zoom on desktop
      }}
      data-view-mode="DESKTOP"
    >
      {allIcons.map((icon) => {
        const isSelected = selectedIds.includes(icon.id);
        return (
          <div
            key={icon.id}
            ref={(el) => { iconRefs.current[icon.id] = el; }}
            onPointerDown={(e) => handleIconClick(icon.id, e)}
            onDoubleClick={() => handleIconDoubleClick(icon)}
            className={`desktop-icon w-[75px] h-[75px] flex flex-col items-center justify-center text-center cursor-default outline-none rounded p-1 ${
              isSelected ? 'focused selected' : ''
            }`}
            style={{
              position: 'relative',
              touchAction: 'none',
            }}
          >
            <div className="icon-wrapper w-[32px] h-[32px] relative flex justify-center items-center">
              <img
                src={icon.icon}
                alt=""
                className="w-[32px] h-[32px] select-none pointer-events-none image-render-pixelated"
              />
              <div
                className="selection-effect absolute top-0 left-0 w-[32px] h-[32px] bg-[#000080] opacity-[0.5] rounded"
                style={{
                  display: isSelected ? 'block' : 'none',
                  mixBlendMode: 'color-burn',
                  WebkitMaskImage: `url(${icon.icon})`,
                  maskImage: `url(${icon.icon})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                }}
              />
            </div>
            <span
              className="title text-xs mt-1 px-1 text-white select-none break-all"
              style={{
                backgroundColor: isSelected ? '#000080' : 'transparent',
                border: isSelected ? '1px dotted #ffffff' : '1px solid transparent',
                textShadow: isSelected ? 'none' : '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
              }}
            >
              {icon.title}
            </span>
          </div>
        );
      })}

      {/* Marquee box overlay */}
      {marquee && (
        <div
          className="marquee absolute border border-dotted border-white pointer-events-none z-[9999]"
          style={{
            left: `${Math.min(marquee.startX, marquee.currentX)}px`,
            top: `${Math.min(marquee.startY, marquee.currentY)}px`,
            width: `${Math.abs(marquee.startX - marquee.currentX)}px`,
            height: `${Math.abs(marquee.startY - marquee.currentY)}px`,
            mixBlendMode: 'difference',
          }}
        />
      )}

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="context-menu absolute bg-[#c0c0c0] text-black border-2 border-outset p-[2px] z-[99999] select-none text-[11px] font-sans flex flex-col w-[150px] shadow"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="px-3 py-1 cursor-default text-gray-500 opacity-60">Arrange Icons</div>
          <div className="px-3 py-1 cursor-default text-gray-500 opacity-60">Line Up Icons</div>
          <div
            onClick={() => window.location.reload()}
            className="hover:bg-[#000080] hover:text-white px-3 py-1 cursor-default"
          >
            Refresh
          </div>
          <div className="h-[1px] bg-gray-400 my-1"></div>
          <div className="px-3 py-1 cursor-default text-gray-500 opacity-60">Paste</div>
          <div className="px-3 py-1 cursor-default text-gray-500 opacity-60">Paste Shortcut</div>
          <div className="h-[1px] bg-gray-400 my-1"></div>

          {/* Submenu New */}
          <div
            onMouseEnter={() => setActiveSubMenu('new')}
            onMouseLeave={() => setActiveSubMenu(null)}
            className={`px-3 py-1 cursor-default flex justify-between items-center relative ${
              activeSubMenu === 'new' ? 'bg-[#000080] text-white' : 'hover:bg-[#000080] hover:text-white'
            }`}
          >
            <span>New</span>
            <span>▶</span>

            {activeSubMenu === 'new' && (
              <div
                className="absolute bg-[#c0c0c0] text-black border-2 border-outset p-[2px] left-[144px] -top-1 w-[130px] flex flex-col z-[100000]"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNewFolder();
                  }}
                  className="hover:bg-[#000080] hover:text-white px-2 py-1 cursor-default flex items-center gap-2"
                >
                  <img src="/images/icons/folder-16x16.png" className="w-3.5 h-3.5" alt="" />
                  <span>Folder</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNewTextFile();
                  }}
                  className="hover:bg-[#000080] hover:text-white px-2 py-1 cursor-default flex items-center gap-2"
                >
                  <img src="/images/icons/notepad-16x16.png" className="w-3.5 h-3.5" alt="" />
                  <span>Text Document</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-gray-400 my-1"></div>
          <div
            onClick={() => {
              openWindow({
                id: 'display-properties',
                title: 'Display Properties',
                appType: 'display-properties',
                icon: '/images/icons/themes-16x16.png',
                width: 360,
                height: 400,
              });
              setContextMenu(null);
            }}
            className="hover:bg-[#000080] hover:text-white px-3 py-1 cursor-default"
          >
            Properties
          </div>
        </div>
      )}
    </div>
  );
};

export default Desktop;
