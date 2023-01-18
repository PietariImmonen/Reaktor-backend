const axios= require('axios')
//Get all the pilots from the API using the id of the drone
const getAllPilots = async (id) => {
    const response = await axios.get(`https://assignments.reaktor.com/birdnest/pilots/${id}`, {
        "Content-Type": "application/json; charset=utf-8"
    })
    return response.data
}

module.exports = getAllPilots