require("dotenv").config()

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN

function verifyWebhook(req, res) {
  console.log("Requête de vérification reçue avec les paramètres:", req.query)

  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  console.log("Mode:", mode)
  console.log("Token reçu:", token)
  console.log("Challenge:", challenge)
  console.log("Token attendu:", process.env.MESSENGER_VERIFY_TOKEN)

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED")
      res.status(200).send(challenge)
    } else {
      console.log("Vérification échouée - Token incorrect ou mode invalide")
      console.log("Mode reçu:", mode, "Mode attendu: subscribe")
      console.log("Token reçu:", token, "Token attendu:", process.env.MESSENGER_VERIFY_TOKEN)
      res.sendStatus(403)
    }
  } else {
    console.log("Paramètres manquants dans la requête")
    res.sendStatus(400)
  }
}

module.exports = {
  verifyWebhook,
  MESSENGER_PAGE_ACCESS_TOKEN: process.env.MESSENGER_PAGE_ACCESS_TOKEN,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
}

