# Spoonacular API Setup

## Current Status
Your API key has reached the **daily free tier limit (50 points)**.

## Options

### 1. Wait for Daily Reset (Recommended for Testing)
Spoonacular resets free tier points daily at ~12 AM UTC.
- Authenticate with a fresh account to test before reset
- Or wait for reset and retry with your original key

### 2. Upgrade Spoonacular Plan
Visit: https://spoonacular.com/food-api/pricing
- Free: 50 points/day
- Pro+: 5,000 points/month (~$10/month)
- Enterprise: Custom

### 3. Replace API Key
1. Go to https://spoonacular.com/food-api
2. Generate a new API key
3. Update `backend/.env`:
   ```env
   SPOONACULAR_API_KEY=<your_new_key>
   ```
4. Restart backend: `npm --prefix backend run dev`

## API Point Costs
- `/recipes/complexSearch`: 1 point
- `/recipes/{id}/information`: 1 point
- `/recipes/random`: 1 point

Each mood request uses ~3-7 points (search + fallbacks).

## Testing Without API
To avoid API calls during development, you can temporarily mock responses in:
- `backend/src/controllers/moodController.js`
- Replace `fetchSpoonacular()` calls with hardcoded recipe arrays
