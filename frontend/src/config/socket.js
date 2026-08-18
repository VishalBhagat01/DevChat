import socket from 'socket.io-client';

let socketInstance = null;
let connectedProjectId = null;

export const initializeSocket = (projectId) => {
    if (!projectId) return null;

    if (socketInstance && connectedProjectId === projectId) {
        return socketInstance;
    }

    if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
    }

    const token = localStorage.getItem('token');

    socketInstance = socket(import.meta.env.VITE_API_URL || window.location.origin, {
        auth: {
            token
        },
        query: {
            projectId
        }
    });

    connectedProjectId = projectId;

    return socketInstance;
}

export const receiveMessage = (eventName, callback) => {
    if (!socketInstance) return;
    socketInstance.on(eventName, callback);

    return () => {
        if (!socketInstance) return;
        socketInstance.off(eventName, callback);
    };
}

export const sendMessage = (eventName, data) => {
    if (!socketInstance) return;
    socketInstance.emit(eventName, data);
}

export const disconnectSocket = () => {
    if (!socketInstance) return;

    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    connectedProjectId = null;
}