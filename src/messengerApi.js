const fetch = require("node-fetch")
const { MESSENGER_PAGE_ACCESS_TOKEN } = require("./config")
const { generateMistralResponse } = require("./mistralApi")
const { searchYoutube, downloadYoutubeVideo } = require("./youtubeApi")

const userStates = {}

async function handleMessage(senderId, receivedMessage) {
  console.log("Début de handleMessage pour senderId:", senderId)
  console.log("Message reçu:", JSON.stringify(receivedMessage))
  try {
    if (receivedMessage.text) {
      const lowerCaseText = receivedMessage.text.toLowerCase()

      if (lowerCaseText === "/yt") {
        userStates[senderId] = "youtube"
        await sendTextMessage(senderId, "Mode YouTube activé. Donnez-moi les mots-clés pour la recherche YouTube.")
      } else if (lowerCaseText === "yt/") {
        userStates[senderId] = "mistral"
        await sendTextMessage(senderId, "Mode Mistral réactivé. Comment puis-je vous aider ?")
      } else if (userStates[senderId] === "youtube") {
        console.log("Recherche YouTube pour:", receivedMessage.text)
        try {
          const videos = await searchYoutube(receivedMessage.text)
          console.log("Résultats de la recherche YouTube:", JSON.stringify(videos))
          await sendYoutubeResults(senderId, videos)
        } catch (error) {
          console.error("Erreur lors de la recherche YouTube:", error)
          await sendTextMessage(
            senderId,
            "Désolé, je n'ai pas pu effectuer la recherche YouTube. Veuillez réessayer plus tard.",
          )
        }
      } else {
        console.log("Génération de la réponse Mistral...")
        const response = await generateMistralResponse(receivedMessage.text)
        console.log("Réponse Mistral générée:", response)
        await sendTextMessage(senderId, response)
      }
      console.log("Message envoyé avec succès")
    } else if (receivedMessage.postback) {
      console.log("Traitement du postback:", JSON.stringify(receivedMessage.postback))
      try {
        const payload = JSON.parse(receivedMessage.postback.payload)
        console.log("Payload du postback:", JSON.stringify(payload))

        if (payload.action === "watch_video") {
          console.log("Action watch_video détectée pour videoId:", payload.videoId)
          await handleWatchVideo(senderId, payload.videoId)
        } else {
          console.log("Action de postback non reconnue:", payload.action)
        }
      } catch (error) {
        console.error("Erreur lors du traitement du postback:", error)
        await sendTextMessage(senderId, "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer plus tard.")
      }
    } else {
      console.log("Message reçu sans texte")
      await sendTextMessage(senderId, "Désolé, je ne peux traiter que des messages texte.")
    }
  } catch (error) {
    console.error("Erreur lors du traitement du message:", error)
    let errorMessage = "Désolé, j'ai rencontré une erreur en traitant votre message. Veuillez réessayer plus tard."
    if (error.message.includes("timeout")) {
      errorMessage =
        "Désolé, la génération de la réponse a pris trop de temps. Veuillez réessayer avec une question plus courte ou plus simple."
    }
    await sendTextMessage(senderId, errorMessage)
  }
  console.log("Fin de handleMessage")
}

async function sendYoutubeResults(recipientId, videos) {
  const elements = videos.map((video) => ({
    title: video.title,
    image_url: video.thumbnail,
    buttons: [
      {
        type: "postback",
        title: "Regarder",
        payload: JSON.stringify({ action: "watch_video", videoId: video.videoId }),
      },
    ],
  }))

  const messageData = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elements,
        },
      },
    },
  }

  await callSendAPI(messageData)
}

async function handleWatchVideo(recipientId, videoId) {
  try {
    console.log("Début du téléchargement de la vidéo pour videoId:", videoId)
    await sendTextMessage(recipientId, "Téléchargement de la vidéo en cours... Cela peut prendre quelques instants.")

    // Télécharger la vidéo vers Cloudinary et obtenir l'URL
    const videoUrl = await downloadYoutubeVideo(videoId)
    console.log("URL de la vidéo Cloudinary:", videoUrl)

    // Essayer d'abord d'envoyer la vidéo
    try {
      await sendVideoMessage(recipientId, videoUrl)
      console.log("Vidéo envoyée avec succès")
    } catch (error) {
      console.error("Erreur lors de l'envoi de la vidéo:", error)

      // Si l'envoi de la vidéo échoue, envoyer un lien
      await sendTextMessage(
        recipientId,
        `Je n'ai pas pu envoyer la vidéo directement. Voici le lien pour la regarder: ${videoUrl}`,
      )
      console.log("Lien de la vidéo envoyé avec succès")
    }
  } catch (error) {
    console.error("Erreur détaillée lors du téléchargement ou de l'envoi de la vidéo:", error)
    await sendTextMessage(recipientId, "Désolé, je n'ai pas pu télécharger la vidéo. Veuillez réessayer plus tard.")
  }
}

async function sendVideoMessage(recipientId, videoUrl) {
  console.log("Envoi de la vidéo à partir de l'URL:", videoUrl)

  const messageData = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: videoUrl,
          is_reusable: true,
        },
      },
    },
  }

  const response = await callSendAPI(messageData)
  console.log("Réponse de l'envoi de la vidéo:", response)
  return response
}

async function sendTextMessage(recipientId, messageText) {
  console.log("Début de sendTextMessage pour recipientId:", recipientId)
  console.log("Message à envoyer:", messageText)

  const chunks = messageText.match(/.{1,2000}/g) || []

  for (const chunk of chunks) {
    const messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        text: chunk,
      },
    }

    try {
      await callSendAPI(messageData)
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      throw error // Propager l'erreur pour la gestion dans handleMessage
    }
  }

  console.log("Fin de sendTextMessage")
}

async function callSendAPI(messageData) {
  console.log("Début de callSendAPI avec messageData:", JSON.stringify(messageData))
  const url = `https://graph.facebook.com/v13.0/me/messages?access_token=${MESSENGER_PAGE_ACCESS_TOKEN}`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    })

    console.log("Réponse reçue de l'API Facebook. Status:", response.status)

    const body = await response.json()
    console.log("Réponse de l'API Facebook:", JSON.stringify(body))

    if (body.error) {
      console.error("Erreur lors de l'appel à l'API Send:", body.error)
      throw new Error(body.error.message)
    }

    console.log("Message envoyé avec succès")
    return body
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Facebook:", error)
    throw error
  }
}

module.exports = {
  handleMessage,
}

