
const droneRouter = require('express').Router()
const axios= require('axios')
const XMLParser = require('xml-js')
const getAllPilot = require('../services/droneService')
//Function for calculating if the Drone is inside the zone, return true of false
const isInside = (x, y) => {
    let square = Math.sqrt(Math.pow((x-250000), 2) + Math.pow((y-250000), 2))
    if(square < 100000) {
      return true
    }
    return false
  }
  //Calculating the distance to the nest, returns the distane from the nest
  const distanceToNest = (x, y) => {
    let square = Math.sqrt(Math.pow((x-250000), 2) + Math.pow((y-250000), 2))
    return square
  }

  const deleteOldDrones = (drones) => {
    const time = Date.now()
    const interval = 600000 // time in milliseconds (10 min)
  
    // Filtered drones that are less than 10 minutes old
    const aliveDrones = drones.filter(i => {
      const aliveTime = time - i.time
      return aliveTime < interval
    })

  
    return aliveDrones
  }
  //All the drones that are inside the zone
  let insideDrones = []
//Function for getting the drones that are inside the zone
const getdrones = async () => {
  //There we get the xml from the API and turn it to JSON
    const response = await axios.get('https://assignments.reaktor.com/birdnest/drones')
    const toJson = XMLParser.xml2js(response.data, {compact: true})
    const allDrones = toJson.report.capture.drone
    //Here we get the drones that are inside the zone
    let inside = allDrones.filter(i => {
      let x = i.positionX._text
      let y = i.positionY._text
      return (isInside(x,y))
    })
  //Here we map the drones to have the id of the drone and also the distance from the nest
    let mapped = inside.map(i => {
      let serial = i.serialNumber._text
      let x = i.positionX._text
      let y = i.positionY._text
      let dist = distanceToNest(x,y)
      return ({
        id: serial,
        distance: dist
      })
    })
    //Here we check if there is drones that are inside the zone
    if(mapped.length > 0) {
      //Getting the pilot data from the api using mapped drones
      Promise.all(
        mapped.map(i => getAllPilot(i.id))
      ).then(data => {
        const dat = data
        let counter = 0
        //Getting the distance of the drone and pilot mapped to same object
        const pilotAndDistance = dat.map(i => {
          counter++
          return({pilot: i, distance: mapped[counter-1].distance})
        })
        counter = 0
        //Adding the objects (Pilot Data and distance) to insideDrones array
        pilotAndDistance.map(i => {
          //Check if the array has the pilot and distance already
          let alrd = insideDrones.find(j => j.id === i.pilot.pilotId )
          if(alrd) {
            //Updating the old drone time
            alrd.time = Date.now()
            //Checking if the distance is larger than the new one. If new one is smaller put the new distance to the array
            if(alrd.distance > i.distance) {
                alrd.distance = i.distance
            }
        } else {
          //If its new pilot and new distance add the object to the insideDrones
          insideDrones.push(
            {
              id: i.pilot.pilotId,
              distance: i.distance,
              firstName: i.pilot.firstName,
              lastName: i.pilot.lastName,
              phone: i.pilot.phoneNumber,
              email: i.pilot.email,
              time: Date.now()
            }
          )
        }
        })
      })
    }
    //Deleting drones that have their lifespan 10 minutes in the insideDrones
    insideDrones = deleteOldDrones(insideDrones)
}
//Get the data every 2 seconds from the APIs
setInterval(getdrones, 2000)

droneRouter.get('/', (request, response) => {
    response.json(insideDrones)
})

module.exports = droneRouter

