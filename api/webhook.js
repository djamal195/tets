const express = require("express")
const bodyParser = require("body-parser")
const { handleMessage } = require("../src/messengerApi")
const { verifyWebhook } = require("../src/config")

const app = express()

app.use(bodyParser.json())

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  console.log("Headers:", JSON.stringify(req.headers))
  console.log("Query:", JSON.stringify(req.query))
  console.log("Body:", JSON.stringify(req.body))
  next()
})

app.get("/api/webhook", (req, res) => {
  console.log("Requête GET reçue pour la vérification du webhook")
  return verifyWebhook(req, res)
})

app.post("/api/webhook", async (req, res) => {
  console.log("Début de la requête POST du webhook")
  console.log("Corps de la requête:", JSON.stringify(req.body))

  const body = req.body

  if (body.object === "page") {
    console.log("Événement de page reçu")
    for (const entry of body.entry) {
      console.log("Entrée reçue:", JSON.stringify(entry))
      if (entry.messaging) {
        const webhookEvent = entry.messaging[0]
        console.log("Événement Webhook reçu:", JSON.stringify(webhookEvent))

        const senderId = webhookEvent.sender.id
        console.log("ID de l'expéditeur:", senderId)

        if (webhookEvent.message) {
          console.log("Message reçu, appel de handleMessage")
          try {
            await handleMessage(senderId, webhookEvent.message)
            console.log("handleMessage terminé avec succès")
          } catch (error) {
            console.error("Erreur lors du traitement du message:", error)
          }
        } else if (webhookEvent.postback) {
          console.log("Postback reçu:", JSON.stringify(webhookEvent.postback))
          try {
            await handleMessage(senderId, { postback: webhookEvent.postback })
            console.log("handleMessage pour postback terminé avec succès")
          } catch (error) {
            console.error("Erreur lors du traitement du postback:", error)
          }
        } else {
          console.log("Événement non reconnu:", webhookEvent)
        }
      } else {
        console.log("Aucun événement de messagerie dans cette entrée")
      }
    }

    res.status(200).send("EVENT_RECEIVED")
  } else {
    console.log("Requête non reconnue reçue")
    res.sendStatus(404)
  }

  console.log("Fin de la requête POST du webhook")
})

app.use((err, req, res, next) => {
  console.error("Erreur non gérée:", err)
  res.status(500).send("Quelque chose s'est mal passé!")
})

module.exports = app

