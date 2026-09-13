const configuredOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

export const isAllowedOrigin = (origin) => {
    if (!origin || configuredOrigins.length === 0) {
        return true;
    }

    return configuredOrigins.includes(origin);
};

export const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true
};
