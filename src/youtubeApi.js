const ytdl = require("ytdl-core")
const YoutubeSearchApi = require("youtube-search-api")
const { uploadStream } = require("./cloudinaryService")
const { connectToDatabase } = require("./database")
const Video = require("./models/Video")

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

    // Connexion à la base de données
    await connectToDatabase()

    // Vérifier si la vidéo existe déjà dans la base de données
    let video = await Video.findOne({ videoId })

    if (video) {
      console.log("Vidéo trouvée dans la base de données:", video.cloudinaryUrl)
      return video.cloudinaryUrl
    }

    // Si la vidéo n'existe pas, la télécharger
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

    // Enregistrer la vidéo dans la base de données
    video = new Video({
      videoId,
      title: info.videoDetails.title,
      cloudinaryUrl: result.secure_url,
      thumbnail: info.videoDetails.thumbnails[0].url,
    })

    await video.save()
    console.log("Vidéo enregistrée dans la base de données")

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

