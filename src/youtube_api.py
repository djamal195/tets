from googleapiclient.discovery import build
import os

# Clé API YouTube (à ajouter dans les variables d'environnement)
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')

def search_youtube(query):
    """
    Recherche des vidéos sur YouTube
    """
    try:
        print(f"Début de la recherche YouTube pour: {query}")
        
        # Créer un service YouTube
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        # Effectuer la recherche
        search_response = youtube.search().list(
            q=query,
            part='snippet',
            maxResults=5,
            type='video'
        ).execute()
        
        # Formater les résultats
        videos = []
        for item in search_response.get('items', []):
            videos.append({
                'title': item['snippet']['title'],
                'thumbnail': item['snippet']['thumbnails']['default']['url'],
                'videoId': item['id']['videoId']
            })
        
        print(f"Résultat de la recherche YouTube: {len(videos)} vidéos trouvées")
        return videos
    except Exception as e:
        print(f"Erreur détaillée lors de la recherche YouTube: {str(e)}")
        raise e

