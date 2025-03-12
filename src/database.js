const mongoose = require("mongoose")
const { MONGODB_URI } = require("./config")

let isConnected = false

async function connectToDatabase() {
  if (isConnected) {
    console.log("=> Utilisation de la connexion existante à la base de données")
    return
  }

  try {
    console.log("=> Connexion à la base de données MongoDB...")
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    isConnected = true
    console.log("=> Connexion à la base de données établie")
  } catch (error) {
    console.error("Erreur de connexion à la base de données:", error)
    throw error
  }
}

module.exports = { connectToDatabase }

