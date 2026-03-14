# MoodFoods go-live checklist

## What is already done in code
- Resend sender set to domain address in backend env format: `MoodFoods <noreply@moodfoods.in>`
- CORS supports production domains using `CORS_ORIGIN`
- Render blueprint added: `render.yaml`
- Health endpoint added: `GET /health`

## 1) Resend setup (required)
1. Open Resend dashboard.
2. Add domain: `moodfoods.in`.
3. Add all DNS records Resend shows in your domain provider.
4. Wait until status is **Verified**.
5. In Render backend env, set:
   - `RESEND_API_KEY`
   - `RESEND_FROM=MoodFoods <noreply@moodfoods.in>`

## 2) Deploy on Render (required)
1. Push code to GitHub.
2. In Render, click **New +** -> **Blueprint** -> select your repo.
3. Render uses `render.yaml` to create:
   - `moodfoods-backend`
   - `moodfoods-frontend`
4. Set backend secrets in Render:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `RESEND_API_KEY`

## 3) Domain mapping (required)
1. Open Render static service `moodfoods-frontend`.
2. Add custom domains:
   - `moodfoods.in`
   - `www.moodfoods.in`
3. Add the DNS records from Render in your domain DNS panel.

## 4) Post-deploy tests
1. Open `https://moodfoods.in`.
2. Health check backend: `https://moodfoods-backend.onrender.com/health`.
3. Register a new user and confirm welcome email arrives.
4. Login and test suggestions, like/dislike, save, and saved foods screen.

## 5) If something fails
- CORS error: verify `CORS_ORIGIN` contains exact frontend URLs.
- Email error: verify Resend domain status is **Verified** and `RESEND_FROM` uses that domain.
- API 401: verify JWT secret matches backend runtime env.
