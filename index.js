const express = require('express')
const app = express()
var cors = require('cors')
const droneRouter = require('./controllers/drones')


app.use(cors())
app.use(express.json())
//Make the app to use droneRouter that is created inside controllers/drones.js
app.use(droneRouter)



const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})