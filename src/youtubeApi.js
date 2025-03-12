const ytdl = require("ytdl-core")
const YoutubeSearchApi = require("youtube-search-api")
const { uploadStream } = require("./cloudinaryService")

async function searchYoutube(query) {
  try {
    console.log("Début de la recherche YouTube pour:", query)
    const result = await YoutubeSearchApi.GetListByKeyword(query, false, 5)
    console.log("Résultat de la recherche YouTube:", JSON.stringify(result))
    return result.items.map((item) => ({
      title: item.title,
      thumbnail: item.thumbnail.thumbnails[0].url,
      videoId: item.id,
    }))
  } catch (error) {
    console.error("Erreur détaillée lors de la recherche YouTube:", error)
    throw error
  }
}

async function downloadYoutubeVideo(videoId) {
  try {
    console.log("Début du téléchargement de la vidéo YouTube:", videoId)
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Obtenir les informations sur la vidéo
    const info = await ytdl.getInfo(videoId)
    console.log("Informations sur la vidéo obtenues")

    // Créer un stream pour la vidéo avec la qualité la plus basse
    const videoStream = ytdl(videoUrl, { quality: "lowest" })

    // Télécharger le stream vers Cloudinary
    console.log("Téléchargement vers Cloudinary...")
    const result = await uploadStream(videoStream, `youtube_${videoId}`)
    console.log("Téléchargement vers Cloudinary terminé:", result.secure_url)

    return result.secure_url
  } catch (error) {
    console.error("Erreur lors du téléchargement de la vidéo:", error)
    throw error
  }
}

module.exports = {
  searchYoutube,
  downloadYoutubeVideo,
}

