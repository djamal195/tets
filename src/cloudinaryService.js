const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require("./config")

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})

/**
 * Télécharge un stream vers Cloudinary
 * @param {Stream} stream - Le stream à télécharger
 * @param {String} publicId - L'identifiant public pour le fichier
 * @returns {Promise<Object>} - Les informations sur le fichier téléchargé
 */
function uploadStream(stream, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        public_id: publicId,
        overwrite: true,
        format: "mp4",
        transformation: [
          { width: 320, crop: "scale" },
          { quality: "auto:low" },
          { duration: 60 }, // Limiter à 60 secondes
        ],
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      },
    )

    stream.pipe(uploadStream)
  })
}

/**
 * Télécharge un buffer vers Cloudinary
 * @param {Buffer} buffer - Le buffer à télécharger
 * @param {String} publicId - L'identifiant public pour le fichier
 * @returns {Promise<Object>} - Les informations sur le fichier téléchargé
 */
function uploadBuffer(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        public_id: publicId,
        overwrite: true,
        format: "mp4",
        transformation: [
          { width: 320, crop: "scale" },
          { quality: "auto:low" },
          { duration: 60 }, // Limiter à 60 secondes
        ],
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      },
    )

    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

module.exports = {
  uploadStream,
  uploadBuffer,
}

