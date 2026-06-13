import fsIndex from './filesystem-index.json';

export interface VFSNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  children?: { [name: string]: VFSNode };
  updatedAt: number;
}

export class MemoryFileSystem {
  private root: VFSNode;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.root = {
      name: 'root',
      type: 'dir',
      children: {
        'C:': {
          name: 'C:',
          type: 'dir',
          children: {},
          updatedAt: Date.now(),
        },
      },
      updatedAt: Date.now(),
    };
    this.bootstrap();
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private normalizePath(path: string): string[] {
    let clean = path.replace(/\\/g, '/');
    if (!clean.toUpperCase().startsWith('C:')) {
      clean = 'C:/' + clean.replace(/^\/+/, '');
    }
    return clean.split('/').filter(Boolean);
  }

  private getNode(parts: string[]): VFSNode | null {
    let current: VFSNode = this.root;
    for (const part of parts) {
      // Match case-insensitively or exactly
      const currentChildren = current.children;
      if (!currentChildren) return null;
      
      const matchedKey = Object.keys(currentChildren).find(
        (key) => key.toLowerCase() === part.toLowerCase()
      );
      if (!matchedKey) return null;
      current = currentChildren[matchedKey];
    }
    return current;
  }

  exists(path: string): boolean {
    return this.getNode(this.normalizePath(path)) !== null;
  }

  readdir(path: string): VFSNode[] {
    const parts = this.normalizePath(path);
    const node = this.getNode(parts);
    if (!node) throw new Error(`Directory not found: ${path}`);
    if (node.type !== 'dir' || !node.children) throw new Error(`Path is not a directory: ${path}`);
    return Object.values(node.children);
  }

  readFile(path: string): string {
    const parts = this.normalizePath(path);
    const node = this.getNode(parts);
    if (!node) throw new Error(`File not found: ${path}`);
    if (node.type !== 'file') throw new Error(`Path is not a file: ${path}`);
    return node.content || '';
  }

  writeFile(path: string, content: string): void {
    const parts = this.normalizePath(path);
    if (parts.length === 0) return;

    const fileName = parts[parts.length - 1];
    const parentParts = parts.slice(0, -1);
    
    let parent = this.getNode(parentParts);
    if (!parent) {
      this.mkdir(parentParts.join('/'));
      parent = this.getNode(parentParts);
    }

    if (!parent || parent.type !== 'dir' || !parent.children) {
      throw new Error(`Invalid parent directory for file: ${path}`);
    }

    // Check if the file already exists case-insensitively to overwrite it under the same name/casing
    const matchedKey = Object.keys(parent.children).find(
      (key) => key.toLowerCase() === fileName.toLowerCase()
    );
    const actualFileName = matchedKey || fileName;

    parent.children[actualFileName] = {
      name: actualFileName,
      type: 'file',
      content,
      updatedAt: Date.now(),
    };
    this.notify();
  }

  mkdir(path: string): void {
    const parts = this.normalizePath(path);
    let current = this.root.children!['C:'];

    for (const part of parts) {
      if (part.toUpperCase() === 'C:') continue;

      if (!current.children) {
        current.children = {};
      }

      // Check if this folder already exists case-insensitively
      const matchedKey = Object.keys(current.children).find(
        (key) => key.toLowerCase() === part.toLowerCase()
      );

      if (matchedKey) {
        current = current.children[matchedKey];
      } else {
        current.children[part] = {
          name: part,
          type: 'dir',
          children: {},
          updatedAt: Date.now(),
        };
        current = current.children[part];
      }
    }
    this.notify();
  }

  rename(oldPath: string, newPath: string): void {
    const oldParts = this.normalizePath(oldPath);
    const newParts = this.normalizePath(newPath);

    if (oldParts.length === 0 || newParts.length === 0) return;

    // Use case-insensitive resolution for source node
    const oldNode = this.getNode(oldParts);
    if (!oldNode) throw new Error(`Source not found: ${oldPath}`);

    const targetFileName = newParts[newParts.length - 1];
    const targetParentParts = newParts.slice(0, -1);
    let targetParent = this.getNode(targetParentParts);
    if (!targetParent) {
      this.mkdir(targetParentParts.join('/'));
      targetParent = this.getNode(targetParentParts);
    }

    if (!targetParent || targetParent.type !== 'dir' || !targetParent.children) {
      throw new Error(`Invalid destination directory: ${newPath}`);
    }

    // Resolve case-insensitive source file name from its parent
    const sourceFileName = oldParts[oldParts.length - 1];
    const sourceParentParts = oldParts.slice(0, -1);
    const sourceParent = this.getNode(sourceParentParts);
    
    let actualSourceFileName = sourceFileName;
    if (sourceParent && sourceParent.children) {
      const matchedSourceKey = Object.keys(sourceParent.children).find(
        (key) => key.toLowerCase() === sourceFileName.toLowerCase()
      );
      if (matchedSourceKey) {
        actualSourceFileName = matchedSourceKey;
      }
    }

    // Resolve target file name case-insensitively if it already exists
    const matchedTargetKey = Object.keys(targetParent.children).find(
      (key) => key.toLowerCase() === targetFileName.toLowerCase()
    );
    const actualTargetFileName = matchedTargetKey || targetFileName;

    // Remove from old parent
    if (sourceParent && sourceParent.children && sourceParent.children[actualSourceFileName]) {
      delete sourceParent.children[actualSourceFileName];
    }

    // Add to new parent
    targetParent.children[actualTargetFileName] = {
      ...oldNode,
      name: actualTargetFileName,
      updatedAt: Date.now(),
    };

    this.notify();
  }

  unlink(path: string): void {
    const parts = this.normalizePath(path);
    if (parts.length === 0) return;

    const fileName = parts[parts.length - 1];
    const parent = this.getNode(parts.slice(0, -1));

    if (parent && parent.children) {
      const matchedKey = Object.keys(parent.children).find(
        (key) => key.toLowerCase() === fileName.toLowerCase()
      );
      if (matchedKey && parent.children[matchedKey]) {
        delete parent.children[matchedKey];
        this.notify();
        return;
      }
    }
    throw new Error(`File not found: ${path}`);
  }

  rmdir(path: string): void {
    const parts = this.normalizePath(path);
    if (parts.length === 0) return;

    const dirName = parts[parts.length - 1];
    const parent = this.getNode(parts.slice(0, -1));

    if (parent && parent.children) {
      const matchedKey = Object.keys(parent.children).find(
        (key) => key.toLowerCase() === dirName.toLowerCase()
      );
      if (matchedKey && parent.children[matchedKey]) {
        const dirNode = parent.children[matchedKey];
        if (dirNode.type !== 'dir') throw new Error(`Path is a file: ${path}`);
        if (dirNode.children && Object.keys(dirNode.children).length > 0) {
          throw new Error(`Directory not empty: ${path}`);
        }
        delete parent.children[matchedKey];
        this.notify();
        return;
      }
    }
    throw new Error(`Directory not found: ${path}`);
  }

  private bootstrap() {
    const cDrive = this.root.children!['C:'];
    cDrive.children = {};

    // Create standard root folders
    this.mkdir('C:/Windows/System');
    this.mkdir('C:/Program Files');
    this.mkdir('C:/Desktop');
    this.mkdir('C:/My Documents');
    this.mkdir('C:/Recycled');

    // Parse the site source files into C:/Program Files/Source Code
    this.mkdir('C:/Program Files/Source Code');
    const progFiles = cDrive.children['Program Files'];
    const sourceCodeFolder = progFiles.children!['Source Code'];

    // Build the memory tree recursively from the JSON index
    const parseIndexNode = (sourceObj: any, targetNode: VFSNode, currentPath: string) => {
      if (!sourceObj) return;
      targetNode.children = targetNode.children || {};

      for (const [key, val] of Object.entries(sourceObj)) {
        if (val === null) {
          // File
          targetNode.children[key] = {
            name: key,
            type: 'file',
            content: `[This is the content of ${currentPath}/${key}]`,
            updatedAt: Date.now(),
          };
        } else {
          // Directory
          const subDir: VFSNode = {
            name: key,
            type: 'dir',
            children: {},
            updatedAt: Date.now(),
          };
          targetNode.children[key] = subDir;
          parseIndexNode(val, subDir, `${currentPath}/${key}`);
        }
      }
    };

    parseIndexNode(fsIndex, sourceCodeFolder, 'C:/Program Files/Source Code');

    // Populate welcome text on Desktop
    this.writeFile(
      'C:/Desktop/Welcome.txt',
      `Welcome to Windows 98 Exact Clone!\n\nThis is a pixel-perfect recreation of the classic web desktop environment.\n\nCreated using Vite, TypeScript, and native layouts.\nDouble-click the desktop icons to run apps.`
    );
    this.writeFile(
      'C:/My Documents/readme.txt',
      `Welcome to My Documents.\n\nYou can edit files in Notepad and save them directly back to the virtual disk.`
    );

    // Add classic system configuration files in root C:
    this.writeFile('C:/autoexec.bat', '@ECHO OFF\nPROMPT $P$G\nPATH C:\\WINDOWS;C:\\WINDOWS\\COMMAND\nSET TEMP=C:\\WINDOWS\\TEMP\nLH MSCDEX.EXE /D:mscd001\nLH SMARTDRV.EXE\necho Windows 98 is now loading...');
    this.writeFile('C:/config.sys', 'DEVICE=C:\\WINDOWS\\HIMEM.SYS\nDEVICE=C:\\WINDOWS\\EMM386.EXE NOEMS\nBUFFERS=15,0\nFILES=30\nDOS=HIGH,UMB\nLASTDRIVE=Z');
  }
}

export const vfs = new MemoryFileSystem();
export default vfs;
