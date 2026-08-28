const apiClient = require("../utils/apiClient")

const apiKey = process.env.API_KEY

exports.getAqi = async() => {
    const data = await apiClient.get(
        `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${apiKey}&format=json`
    )
    console.log(data)

    return data.records
    // const records = response.data.records
    
    // return data.records.map(record => new Aqi(record))
}