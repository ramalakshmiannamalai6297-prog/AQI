exports.get = async (url) => {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            throw new Error(`API returned HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        const reason = error.cause?.message || error.message;

        throw new Error(
            `Unable to reach AQI data source: ${reason}`
        );
    }
};