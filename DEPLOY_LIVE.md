# MoodFoods live deployment (moodfoods.in)

## 1) Resend domain sender
1. In Resend dashboard, add domain `moodfoods.in`.
2. Add DNS records shown by Resend in your domain DNS panel.
3. Wait until Resend marks the domain as verified.
4. Keep backend env: `RESEND_FROM=MoodFoods <noreply@moodfoods.in>`.

## 2) Deploy backend + frontend on Render
1. Push this project to GitHub.
2. In Render, create a new **Blueprint** and select this repo.
3. Render reads [render.yaml](render.yaml) and creates:
   - `moodfoods-backend` (Node web service)
   - `moodfoods-frontend` (Vite static site)
4. In backend service env, set secrets:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `RESEND_API_KEY`

## 3) Attach your domain
1. Open the Render static service `moodfoods-frontend`.
2. Add custom domains:
   - `moodfoods.in`
   - `www.moodfoods.in`
3. Add the DNS records Render gives you in your domain provider.

## 4) Final checks
1. Open `https://moodfoods.in`.
2. Register a new account and confirm welcome email delivery.
3. Login and verify recommendations load.
4. Verify Like/Dislike and Saved Foods work.

## Notes
- Backend CORS is now controlled by `CORS_ORIGIN` (comma-separated list).
- Local development still works if `CORS_ORIGIN` is not set.
