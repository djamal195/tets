const ytdl = require("ytdl-core")
const { youtube } = require("youtube-search-api")
const fs = require("fs")
const path = require("path")

async function searchYoutube(query) {
  try {
    const result = await youtube.GetListByKeyword(query, false, 5)
    return result.items.map((item) => ({
      title: item.title,
      thumbnail: item.thumbnail.thumbnails[0].url,
      videoId: item.id,
    }))
  } catch (error) {
    console.error("Erreur lors de la recherche YouTube:", error)
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

