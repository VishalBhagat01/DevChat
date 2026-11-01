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
    const isProduction = process.env.NODE_ENV === 'production';

    // ─── Production Safety: Block all cross-origin if CLIENT_URL is not set ───
    // In production, an empty CLIENT_URL means misconfiguration — deny by default
    // rather than silently allowing every origin with credentials.
    if (isProduction && configuredOrigins.length === 0) {
        console.error(
            '[CORS FATAL] CLIENT_URL is not set in production! ' +
            'All cross-origin requests will be blocked. ' +
            'Set CLIENT_URL=https://your-frontend.com in your environment variables.'
        );
        return false;
    }

    // In development or when no CLIENT_URL configured, allow all localhost and 127.0.0.1 origins on any port
    if (!isProduction && configuredOrigins.length === 0) {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return true;
        }
        // In development with no configured origins and a non-localhost origin, deny
        return false;
    }

    // Allow localhost in non-production even when CLIENT_URL is set
    // (so dev and staging can still work alongside configured origins)
    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
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
