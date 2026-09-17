import React from 'react';
import { FileIcon } from '../../utils/fileIcons';

const EditorTabs = ({
  openFiles = [],
  currentFile,
  onSelectFile,
  onCloseFile,
  onCloseOthers,
  onCloseAll,
  dirtyFiles = new Set(),
  projectName = 'project'
}) => {
  if (!openFiles.length) {
    return (
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0d0d12] px-4 text-xs text-neutral-500">
        <span className="flex items-center gap-2">
          <i className="ri-folder-line text-neutral-600"></i>
          <span>{projectName}</span>
          <span className="text-neutral-700">/</span>
          <span className="italic text-neutral-600">No file opened</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0d0d12]">
      {/* Scrollable Tabs */}
      <div className="flex h-full min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-none">
        {openFiles.map((file) => {
          const isActive = currentFile === file;
          const isDirty = dirtyFiles.has(file);

          return (
            <div
              key={file}
              onClick={() => onSelectFile(file)}
              className={`group relative flex cursor-pointer items-center gap-2 border-r border-white/[0.06] px-3.5 text-xs transition-all ${
                isActive
                  ? 'bg-[#09090b] text-white font-medium shadow-[inset_0_-2px_0_0_#6366f1]'
                  : 'bg-transparent text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'
              }`}
            >
              <FileIcon filename={file} className="text-sm shrink-0" />
              <span className="max-w-[150px] truncate">{file}</span>

              {/* Status or Close Button */}
              <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                {isDirty ? (
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)] group-hover:hidden" />
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(file);
                  }}
                  className={`rounded p-0.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white ${
                    isDirty ? 'hidden group-hover:block' : 'opacity-60 group-hover:opacity-100'
                  }`}
                  title="Close tab"
                >
                  <i className="ri-close-line text-xs"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Context Actions */}
      <div className="flex shrink-0 items-center gap-1 border-l border-white/[0.06] px-2 text-neutral-400">
        <button
          type="button"
          onClick={onCloseOthers}
          title="Close other tabs"
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/[0.06] hover:text-neutral-200 text-xs"
        >
          <i className="ri-close-circle-line"></i>
        </button>
        <button
          type="button"
          onClick={onCloseAll}
          title="Close all tabs"
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/[0.06] hover:text-neutral-200 text-xs"
        >
          <i className="ri-delete-bin-7-line"></i>
        </button>
      </div>
    </div>
  );
};

export default EditorTabs;
