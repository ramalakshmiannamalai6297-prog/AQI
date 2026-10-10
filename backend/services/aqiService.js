const apiClient = require("../utils/apiClient");

const apiKey = process.env.API_KEY;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

function wait(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

exports.getAqi = async () => {
    const url =
        "https://api.data.gov.in/resource/" +
        "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69" +
        `?api-key=${apiKey}&format=json`;

    let lastError;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const data = await apiClient.get(url);

            if (!Array.isArray(data.records)) {
                throw new Error("API response does not contain records.");
            }

            return data.records;
        } catch (error) {
            lastError = error;

            console.warn(
                `AQI API attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
                error.message
            );

            if (attempt < MAX_ATTEMPTS) {
                await wait(RETRY_DELAY_MS);
            }
        }
    }

    throw lastError;
};