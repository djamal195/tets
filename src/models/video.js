const mongoose = require("mongoose")

const videoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Vérifier si le modèle existe déjà pour éviter les erreurs de redéfinition
const Video = mongoose.models.Video || mongoose.model("Video", videoSchema)

module.exports = Video

