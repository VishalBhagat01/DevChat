import React, { useState } from 'react';
import { FileIcon } from '../../utils/fileIcons';
import { sounds } from '../../utils/soundEffects';

const FileExplorer = ({
  fileTree = {},
  currentFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onExportZip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const files = Object.keys(fileTree || {}).sort((a, b) => {
    // Put package.json / config files first or alphabetical
    return a.localeCompare(b);
  });

  const filteredFiles = files.filter((file) =>
    file.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewFileName('');
    sounds.playClick();
  };

  const handleConfirmCreate = (e) => {
    e.preventDefault();
    const cleanName = newFileName.trim();
    if (!cleanName) {
      setIsCreating(false);
      return;
    }
    onCreateFile(cleanName);
    setIsCreating(false);
    setNewFileName('');
    sounds.playPop();
  };

  const handleStartRename = (file, e) => {
    e.stopPropagation();
    setRenamingFile(file);
    setRenameValue(file);
  };

  const handleConfirmRename = (e) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue.trim() !== renamingFile) {
      onRenameFile(renamingFile, renameValue.trim());
      sounds.playPop();
    }
    setRenamingFile(null);
    setRenameValue('');
  };

  return (
    <aside className="flex h-full w-full flex-col bg-[#0c0c10] select-none">
      {/* Explorer Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.08] px-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <i className="ri-folders-line text-blue-400"></i>
          <span>Explorer</span>
        </div>

        <div className="flex items-center gap-1 text-neutral-400">
          <button
            type="button"
            onClick={handleStartCreate}
            title="New File"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/[0.08] hover:text-white text-xs"
          >
            <i className="ri-file-add-line"></i>
          </button>
          <button
            type="button"
            onClick={onExportZip}
            title="Download Files"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/[0.08] hover:text-white text-xs"
          >
            <i className="ri-download-cloud-2-line"></i>
          </button>
        </div>
      </div>

      {/* Search Files */}
      {files.length > 5 && (
        <div className="border-b border-white/[0.05] p-2">
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 focus-within:border-blue-500/40">
            <i className="ri-search-line text-xs text-neutral-500"></i>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-neutral-200 placeholder:text-neutral-600 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-500 hover:text-white text-xs"
              >
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* File List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5 scrollbar-none">
        {/* Inline Create Input */}
        {isCreating && (
          <form onSubmit={handleConfirmCreate} className="mb-1 px-1">
            <div className="flex items-center gap-1.5 rounded-md border border-blue-500/50 bg-blue-500/10 px-2 py-1">
              <i className="ri-file-add-line text-xs text-blue-400"></i>
              <input
                type="text"
                autoFocus
                placeholder="filename.js"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={handleConfirmCreate}
                className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 outline-none"
              />
            </div>
          </form>
        )}

        {filteredFiles.length === 0 && !isCreating && (
          <div className="py-8 px-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-neutral-600">
              <i className="ri-file-code-line text-sm"></i>
            </div>
            <p className="text-xs text-neutral-500">
              {files.length === 0 ? 'No files in project' : 'No matching files'}
            </p>
            {files.length === 0 && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="mt-3 inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[11px] text-neutral-300 hover:bg-white/[0.06]"
              >
                <i className="ri-add-line text-xs text-blue-400"></i>
                Create first file
              </button>
            )}
          </div>
        )}

        <div className="space-y-0.5">
          {filteredFiles.map((file) => {
            const isSelected = currentFile === file;
            const isRenaming = renamingFile === file;

            if (isRenaming) {
              return (
                <form key={file} onSubmit={handleConfirmRename} className="px-1 py-0.5">
                  <div className="flex items-center gap-1 rounded border border-blue-500 bg-blue-500/10 px-2 py-1">
                    <FileIcon filename={file} className="text-xs shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleConfirmRename}
                      className="w-full bg-transparent text-xs text-white outline-none"
                    />
                  </div>
                </form>
              );
            }

            return (
              <div
                key={file}
                onClick={() => {
                  onSelectFile(file);
                  sounds.playClick();
                }}
                className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 text-white font-medium ring-1 ring-inset ring-blue-500/25 shadow-sm'
                    : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileIcon filename={file} className="text-xs shrink-0" />
                  <span className="truncate">{file}</span>
                </div>

                {/* Hover Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(file, e)}
                    title="Rename file"
                    className="p-0.5 rounded text-neutral-500 hover:bg-white/[0.08] hover:text-neutral-200"
                  >
                    <i className="ri-edit-line text-[11px]"></i>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete ${file}?`)) {
                        onDeleteFile(file);
                        sounds.playPop();
                      }
                    }}
                    title="Delete file"
                    className="p-0.5 rounded text-neutral-500 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <i className="ri-delete-bin-line text-[11px]"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default FileExplorer;
