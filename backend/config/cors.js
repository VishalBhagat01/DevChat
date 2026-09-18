const getConfiguredOrigins = () => {
    return (process.env.CLIENT_URL || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
};

export const isAllowedOrigin = (origin) => {
    // Allow non-browser requests (e.g. Postman, curl, server-to-server)
    if (!origin) {
        return true;
    }

    const configuredOrigins = getConfiguredOrigins();

    // In development or when no CLIENT_URL configured, allow all localhost and 127.0.0.1 origins on any port
    if (process.env.NODE_ENV !== 'production' || configuredOrigins.length === 0) {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return true;
        }
    }

    if (configuredOrigins.length === 0) {
        return true;
    }

    return configuredOrigins.includes(origin);
};

export const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS Blocked] Origin "${origin}" is not allowed by CORS configuration.`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};
