const ytdl = require("ytdl-core")
const YoutubeSearchApi = require("youtube-search-api")
const fs = require("fs")
const path = require("path")

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
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const outputPath = path.join("/tmp", `${videoId}.mp4`)

  return new Promise((resolve, reject) => {
    ytdl(videoUrl, { quality: "lowest" })
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        console.log("Téléchargement terminé")
        resolve(outputPath)
      })
      .on("error", (error) => {
        console.error("Erreur lors du téléchargement:", error)
        reject(error)
      })
  })
}

module.exports = {
  searchYoutube,
  downloadYoutubeVideo,
}

