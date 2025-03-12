import re
import requests
import json
from src.config import MISTRAL_API_KEY

def check_creator_question(prompt):
    """
    Vérifie si la question concerne le créateur du bot
    """
    prompt = prompt.lower()
    patterns = [
        r"qui (t'a|ta|t as) (créé|cree|construit|développé|developpe|conçu|concu|fabriqué|fabrique|inventé|invente)",
        r"par qui as[- ]?tu (été|ete) (créé|cree|développé|developpe|construit|conçu|concu)",
        r"qui est (ton|responsable de|derrière|derriere) (créateur|createur|développeur|developpeur|toi)",
        r"d['oòo]u viens[- ]?tu"
    ]
    
    for pattern in patterns:
        if re.search(pattern, prompt):
            return True
    
    return False

def generate_mistral_response(prompt):
    """
    Génère une réponse en utilisant l'API Mistral
    """
    print(f"Début de generate_mistral_response pour prompt: {prompt}")
    
    # Vérifier si la question concerne le créateur
    if check_creator_question(prompt):
        print("Question sur le créateur détectée. Réponse personnalisée envoyée.")
        return "J'ai été créé par Djamaldine Montana avec l'aide de Mistral. C'est un développeur talentueux qui m'a conçu pour aider les gens comme vous !"
    
    try:
        import signal
        
        # Définir un timeout
        def timeout_handler(signum, frame):
            print("Timeout atteint pour la requête Mistral")
            raise TimeoutError("La requête a pris trop de temps")
        
        # Configurer le timeout à 50 secondes
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(50)
        
        print("Envoi de la requête à l'API Mistral...")
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {MISTRAL_API_KEY}"
            },
            json={
                "model": "mistral-large-latest",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1000
            }
        )
        
        # Désactiver le timeout
        signal.alarm(0)
        
        print(f"Réponse reçue de l'API Mistral. Status: {response.status_code}")
        
        if response.status_code != 200:
            error_body = response.text
            print(f"Erreur API Mistral: {response.status_code} - {error_body}")
            raise Exception(f"HTTP error! status: {response.status_code}")
        
        data = response.json()
        print(f"Données reçues de l'API Mistral: {json.dumps(data)}")
        
        generated_response = data['choices'][0]['message']['content']
        
        if len(generated_response) > 4000:
            generated_response = generated_response[:4000] + "... (réponse tronquée)"
        
        print(f"Réponse générée: {generated_response}")
        return generated_response
    except TimeoutError:
        print("Erreur de timeout lors de la génération de la réponse Mistral")
        return "Désolé, la génération de la réponse a pris trop de temps. Veuillez réessayer avec une question plus courte ou plus simple."
    except Exception as e:
        print(f"Erreur détaillée lors de la génération de la réponse Mistral: {str(e)}")
        if isinstance(e, TimeoutError) or "timeout" in str(e):
            return "Désolé, la génération de la réponse a pris trop de temps. Veuillez réessayer avec une question plus courte ou plus simple."
        return "Je suis désolé, mais je ne peux pas répondre pour le moment. Veuillez réessayer plus tard."

