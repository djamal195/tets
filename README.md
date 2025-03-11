# JekleBot - Messenger Chatbot with Mistral AI

This is a Messenger chatbot that uses Mistral AI to generate responses.

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your tokens and keys
4. Deploy to Vercel or run locally with `npm start`

## Deployment

This bot is designed to be deployed on Vercel. Connect your GitHub repository to Vercel for automatic deployments.

## Environment Variables

Make sure to set the following environment variables in your Vercel project:

- MESSENGER_VERIFY_TOKEN
- MESSENGER_PAGE_ACCESS_TOKEN
- MISTRAL_API_KEY

## Webhook URL

After deployment, your webhook URL will be:
`https://your-vercel-app-name.vercel.app/api/webhook`

Update this URL in your Facebook App settings.