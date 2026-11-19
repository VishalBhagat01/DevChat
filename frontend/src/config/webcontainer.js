import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;
let webContainerBootPromise = null;

export const toWebContainerTree = (fileTree = {}) => {
    const root = {};

    Object.entries(fileTree).forEach(([filePath, fileData]) => {
        const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
        if (!parts.length || parts.some((part) => part === '.' || part === '..')) {
            throw new Error(`Invalid project file path: "${filePath}"`);
        }

        const fileName = parts.pop();
        let directory = root;

        parts.forEach((directoryName) => {
            const existing = directory[directoryName];
            if (existing && !existing.directory) {
                throw new Error(`File path conflicts with directory: "${filePath}"`);
            }
            directory[directoryName] = existing || { directory: {} };
            directory = directory[directoryName].directory;
        });

        if (directory[fileName]?.directory) {
            throw new Error(`Directory path conflicts with file: "${filePath}"`);
        }

        directory[fileName] = {
            file: {
                contents: fileData?.file?.contents ?? '',
            },
        };
    });

    return root;
};

export const getWebContainer = async () => {
    if (webContainerInstance) {
        return webContainerInstance;
    }

    if (!webContainerBootPromise) {
        webContainerBootPromise = WebContainer.boot()
            .then((container) => {
                webContainerInstance = container;
                return container;
            })
            .catch((error) => {
                webContainerBootPromise = null;
                throw error;
            });
    }

    return webContainerBootPromise;
}