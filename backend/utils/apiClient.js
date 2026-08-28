exports.get = async (url) =>{
    const response = await fetch(url)

    if(!response.ok) {
        throw new Error(`API Error: ${response.status}`)
    }
    return await response.json() 
}