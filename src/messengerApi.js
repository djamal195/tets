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
        await sendTextMessage(senderId, "Mode JekleTube activé. Donnez-moi les mots-clés pour la recherche YouTube.")
      } else if (lowerCaseText === "yt/") {
        userStates[senderId] = "mistral"
        await sendTextMessage(senderId, "Mode JekleBot réactivé. Comment puis-je vous aider ?")
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
      const payload = JSON.parse(receivedMessage.postback.payload)
      if (payload.action === "watch_video") {
        await handleWatchVideo(senderId, payload.videoId)
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
    await sendTextMessage(recipientId, "Téléchargement de la vidéo en cours...")
    const videoPath = await downloadYoutubeVideo(videoId)
    await sendVideoMessage(recipientId, videoPath)
  } catch (error) {
    console.error("Erreur lors du téléchargement de la vidéo:", error)
    await sendTextMessage(recipientId, "Désolé, je n'ai pas pu télécharger la vidéo. Veuillez réessayer plus tard.")
  }
}

async function sendVideoMessage(recipientId, videoPath) {
  const messageData = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: videoPath,
          is_reusable: true,
        },
      },
    },
  }

  await callSendAPI(messageData)
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
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Facebook:", error)
    throw error
  }
}

module.exports = {
  handleMessage,
}

