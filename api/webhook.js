const express = require("express")
const bodyParser = require("body-parser")
const { handleMessage } = require("../src/messengerApi")
const { verifyWebhook } = require("../src/config")

const app = express()

app.use(bodyParser.json())

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  console.log("Query:", JSON.stringify(req.query))
  console.log("Body:", JSON.stringify(req.body))
  next()
})

app.get("/api/webhook", (req, res) => {
  console.log("Requête GET reçue pour la vérification du webhook")
  return verifyWebhook(req, res)
})

app.post("/api/webhook", async (req, res) => {
  console.log("Requête POST reçue du webhook")
  const body = req.body

  if (body.object === "page") {
    console.log("Événement de page reçu")
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0]
      console.log("Événement Webhook reçu:", JSON.stringify(webhookEvent))

      const senderId = webhookEvent.sender.id

      if (webhookEvent.message || webhookEvent.postback) {
        console.log("Message ou postback reçu, appel de handleMessage")
        try {
          await handleMessage(senderId, webhookEvent.message || webhookEvent.postback)
          console.log("handleMessage terminé avec succès")
        } catch (error) {
          console.error("Erreur lors du traitement du message:", error)
        }
      } else {
        console.log("Événement non reconnu:", webhookEvent)
      }
    }

    res.status(200).send("EVENT_RECEIVED")
  } else {
    console.log("Requête non reconnue reçue")
    res.sendStatus(404)
  }
})

app.use((err, req, res, next) => {
  console.error("Erreur non gérée:", err)
  res.status(500).send("Quelque chose s'est mal passé!")
})

module.exports = app

