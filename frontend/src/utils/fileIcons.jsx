import React from 'react';

export const getFileDetails = (filename = '') => {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  const base = parts.join('.');

  let language = 'javascript';
  let iconClass = 'ri-file-code-line';
  let iconColor = 'text-blue-400';

  if (filename === 'package.json') {
    return { language: 'json', iconClass: 'ri-node-tree', iconColor: 'text-emerald-400' };
  }
  if (filename.startsWith('.env')) {
    return { language: 'ini', iconClass: 'ri-key-2-line', iconColor: 'text-amber-400' };
  }
  if (filename.toLowerCase().includes('docker')) {
    return { language: 'dockerfile', iconClass: 'ri-anchor-line', iconColor: 'text-sky-400' };
  }

  switch (ext) {
    case 'jsx':
      language = 'javascript';
      iconClass = 'ri-reactjs-line';
      iconColor = 'text-cyan-400';
      break;
    case 'js':
    case 'mjs':
    case 'cjs':
      language = 'javascript';
      iconClass = 'ri-javascript-line';
      iconColor = 'text-yellow-400';
      break;
    case 'tsx':
      language = 'typescript';
      iconClass = 'ri-reactjs-line';
      iconColor = 'text-blue-400';
      break;
    case 'ts':
      language = 'typescript';
      iconClass = 'ri-code-s-slash-line';
      iconColor = 'text-blue-400';
      break;
    case 'json':
      language = 'json';
      iconClass = 'ri-braces-line';
      iconColor = 'text-amber-400';
      break;
    case 'html':
      language = 'html';
      iconClass = 'ri-html5-line';
      iconColor = 'text-orange-500';
      break;
    case 'css':
    case 'scss':
      language = 'css';
      iconClass = 'ri-css3-line';
      iconColor = 'text-sky-400';
      break;
    case 'md':
    case 'markdown':
      language = 'markdown';
      iconClass = 'ri-markdown-line';
      iconColor = 'text-purple-400';
      break;
    case 'py':
      language = 'python';
      iconClass = 'ri-code-box-line';
      iconColor = 'text-green-400';
      break;
    case 'sql':
      language = 'sql';
      iconClass = 'ri-database-2-line';
      iconColor = 'text-pink-400';
      break;
    case 'sh':
    case 'bash':
      language = 'shell';
      iconClass = 'ri-terminal-line';
      iconColor = 'text-emerald-400';
      break;
    case 'yaml':
    case 'yml':
      language = 'yaml';
      iconClass = 'ri-file-settings-line';
      iconColor = 'text-rose-400';
      break;
    case 'svg':
      language = 'xml';
      iconClass = 'ri-image-line';
      iconColor = 'text-teal-400';
      break;
    default:
      language = 'plaintext';
      iconClass = 'ri-file-text-line';
      iconColor = 'text-neutral-400';
  }

  return { language, iconClass, iconColor };
};

export const FileIcon = ({ filename, className = 'text-sm' }) => {
  const { iconClass, iconColor } = getFileDetails(filename);
  return <i className={`${iconClass} ${iconColor} ${className}`} />;
};
