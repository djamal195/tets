const fetch = require("node-fetch")
const { MISTRAL_API_KEY } = require("./config")

function checkCreatorQuestion(prompt) {
  const lowerPrompt = prompt.toLowerCase()
  return (
  /qui (t'a|ta|t as) (créé|cree|construit|développé|developpe|conçu|concu|fabriqué|fabrique|inventé|invente)/.test(lowerPrompt) ||
  /par qui as[- ]?tu (été|ete) (créé|cree|développé|developpe|construit|conçu|concu)/.test(lowerPrompt) ||
  /qui est (ton|responsable de|derrière|derriere) (créateur|createur|développeur|developpeur|toi)/.test(lowerPrompt) ||
  /d['oòo]u viens[- ]?tu/.test(lowerPrompt)
);


}

async function generateMistralResponse(prompt) {
  console.log("Début de generateMistralResponse pour prompt:", prompt)

  // Vérifier si la question concerne le créateur
  if (checkCreatorQuestion(prompt)) {
    console.log("Question sur le créateur détectée. Réponse personnalisée envoyée.")
    return "J'ai été créé par Djamaldine Montana avec l'aide de Mistral. C'est un développeur talentueux qui m'a conçu pour aider les gens comme vous !"
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
      console.log("Timeout atteint pour la requête Mistral")
    }, 50000) // 50 secondes de timeout

    console.log("Envoi de la requête à l'API Mistral...")
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    console.log("Réponse reçue de l'API Mistral. Status:", response.status)

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Erreur API Mistral: ${response.status} - ${errorBody}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Données reçues de l'API Mistral:", JSON.stringify(data))

    let generatedResponse = data.choices[0].message.content

    if (generatedResponse.length > 4000) {
      generatedResponse = generatedResponse.substring(0, 4000) + "... (réponse tronquée)"
    }

    console.log("Réponse générée:", generatedResponse)
    return generatedResponse
  } catch (error) {
    console.error("Erreur détaillée lors de la génération de la réponse Mistral:", error)
    if (error.name === "AbortError") {
      return "Désolé, la génération de la réponse a pris trop de temps. Veuillez réessayer avec une question plus courte ou plus simple."
    }
    return "Je suis désolé, mais je ne peux pas répondre pour le moment. Veuillez réessayer plus tard."
  }
}

module.exports = {
  generateMistralResponse,
}

