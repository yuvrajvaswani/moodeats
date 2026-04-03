# 🍜 MoodEats

**AI-powered food recommendations based on your mood.** MoodEats is a full-stack web application that recommends recipes tailored to your emotional state, including meal planning, nutrition tracking, budget management, and an AI cooking assistant.

[![Node.js](https://img.shields.io/badge/Node.js-20-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com/)
[![Spoonacular API](https://img.shields.io/badge/Spoonacular-Recipe%20API-FF6B6B)](https://spoonacular.com/food-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Live Demo

**Frontend**: http://localhost:5173 (Vite dev server)  
**Backend**: http://localhost:5000/api (Express API)

### Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start backend (Terminal 1)
npm --prefix backend run dev

# Start frontend (Terminal 2)
npm --prefix frontend run dev
```

Open **http://localhost:5173** in your browser.

---

## 📸 Screenshots

### Login & Authentication
![Login Page](screenshots/01_home.png)
> Clean, intuitive login interface with Google OAuth integration. "Hungry but confused? We got you." — MoodEats helps you decide what to eat based on your mood.

---

## ✨ Core Features

### 🧠 AI-Powered Mood-Based Recommendations
- **Mood Analysis**: Chatbot interface asks about your current mood and preferences
- **Smart Recommendations**: AI analyzes mood and suggests recipes that match your emotional state
- **Recipe Discovery**: Infinite scroll through personalized recipe feed based on mood patterns

### 📅 Meal Planning
- **Weekly Planner**: Plan your meals for the entire week
- **Drag-and-Drop Interface**: Easy-to-use meal scheduling
- **Nutrition Summary**: View aggregated nutrition for planned meals
- **Auto-Generate Plans**: AI can generate meal plans based on goals and preferences

### 💰 Budget Meal Planner
- **Budget Calculator**: Find recipes within your specified budget
- **Cost Breakdown**: Ingredient costs and estimated meal pricing
- **Savings Tracking**: Monitor spending and find economical recipes
- **Smart Filtering**: Filter by price, serving size, and nutrition

### 📊 Nutrition Tracker
- **Macro Breakdown**: Track proteins, carbs, fats with visual charts
- **Calorie Counter**: Monitor daily intake against goals
- **Nutrient Analysis**: Detailed nutritional info for all recipes
- **Health Goals**: Set and track fitness goals (weight loss, muscle gain, etc.)

### 🤖 AI Cooking Assistant
- **Step-by-Step Guidance**: Real-time cooking instructions via chatbot
- **Ingredient Substitutions**: AI suggests alternatives for ingredients
- **Cooking Tips**: Pro tips and techniques explained
- **Timer Integration**: Manage cooking times seamlessly

### ⭐ Recipe Management
- **Save Favorites**: Bookmark recipes for later
- **Recipe Details**: Full ingredient lists,nutritional info, and reviews
- **Recipe Comparison**: Compare two recipes side-by-side
- **Search & Filter**: Find recipes by cuisine, dietary restrictions, allergies

### 👤 User Profiles
- **Dietary Preferences**: Vegan, Keto, Gluten-free, etc.
- **Allergies & Restrictions**: Manage food allergies and restrictions
- **Flavor Preferences**: Set preferred cuisines and flavors
- **Health Goals**: Track fitness and nutrition objectives

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 18 + Vite | Fast, responsive UI |
| **Styling** | CSS3 | Modern, clean design |
| **Routing** | React Router v6 | Page navigation |
| **HTTP Client** | Axios | API requests |
| **Charts** | Recharts | Nutrition & analytics visualizations |
| **Auth** | Google OAuth 2.0 | Third-party authentication |
| **Backend** | Node.js + Express | REST API server |
| **Database** | MongoDB + Mongoose | Data persistence |
| **Auth** | JWT + bcrypt | Secure authentication |
| **Email** | Nodemailer / Resend | Email notifications |
| **Recipe API** | Spoonacular API | 900K+ recipes database |
| **Hosting** | Railway.app / Render / Vercel | Cloud deployment |

---

## 📁 Project Structure

```
MoodEats/
├── frontend/                          # React UI (Port 5173)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx             ← Authentication
│   │   │   ├── Register.jsx
│   │   │   ├── ChatHome.jsx          ← AI mood chatbot
│   │   │   ├── Discover.jsx          ← Recipe discovery
│   │   │   ├── RecipeDetails.jsx     ← Individual recipe
│   │   │   ├── Planner.jsx           ← Meal planning
│   │   │   ├── BudgetPlanner.jsx     ← Budget-conscious meals
│   │   │   ├── NutritionTracker.jsx  ← Nutrition analytics
│   │   │   ├── Saved.jsx             ← Saved recipes
│   │   │   ├── RecipeComparison.jsx  ← Compare recipes
│   │   │   └── ChatInterface/        ← Cooking assistant
│   │   ├── components/
│   │   │   ├── RecipeCard.jsx
│   │   │   ├── AIRecipeCard.jsx
│   │   │   ├── RecipeFeed.jsx
│   │   │   ├── MealPlanner/
│   │   │   ├── MacroChart.jsx        ← Nutrition visualizations
│   │   │   ├── ChatbotWidget.jsx
│   │   │   └── layout/               ← Header, sidebar, footer
│   │   └── services/                 ← API calls
│   ├── vite.config.js               ← Vite configuration
│   └── package.json
│
├── backend/                           # Express API (Port 5000)
│   ├── src/
│   │   ├── index.js                 ← Main server
│   │   ├── config/
│   │   │   └── db.js                ← MongoDB connection
│   │   ├── routes/
│   │   │   ├── authRoutes.js        ← Login, register, JWT
│   │   │   ├── aiRoutes.js          ← AI mood analysis
│   │   │   ├── recipeRoutes.js      ← Recipe CRUD
│   │   │   └── userRoutes.js        ← User profile
│   │   ├── models/
│   │   │   ├── User.js              ← User schema
│   │   │   ├── Recipe.js            ← Saved recipes
│   │   │   ├── MealPlan.js          ← Meal plans
│   │   │   └── ChatHistory.js       ← Conversation logs
│   │   ├── controllers/             ← Business logic
│   │   ├── middleware/              ← Auth, validation
│   │   └── scripts/
│   │       └── importRecipeCatalog.js ← Spoonacular sync
│   ├── .env.example                 ← Environment template
│   └── package.json
│
├── README.md                        ← This file
├── package.json                     ← Root scripts
├── railway.json                     ← Railway deployment
├── render.yaml                      ← Render deployment
└── vercel.json                      ← Vercel frontend deployment
```

---

## 🚀 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create new account |
| POST | `/login` | Login with email/password |
| POST | `/google` | Google OAuth login |
| POST | `/refresh` | Refresh JWT token |
| POST | `/logout` | Logout user |

### AI Recommendations (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommend` | Get mood-based recipe recommendations |
| POST | `/analyze-mood` | Analyze user mood from text |
| POST | `/chat` | Chat with cooking assistant |

### Recipes (`/api/recipes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Search all recipes |
| GET | `/:id` | Get recipe details |
| POST | `/save` | Save recipe to favorites |
| GET | `/saved` | Get user's saved recipes |
| DELETE | `/:id` | Remove saved recipe |

### User (`/api/user`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| GET | `/preferences` | Get dietary preferences |
| PUT | `/preferences` | Update preferences |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend health status |

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/moodeats

# JWT
JWT_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Email Service
RESEND_API_KEY=your-resend-api-key
RESEND_FROM=MoodFoods <noreply@moodfoods.in>

# CORS
CORS_ORIGIN=http://localhost:5173,https://moodfoods.in

# Spoonacular
SPOONACULAR_API_KEY=your-api-key
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 🔗 Integrations

### Spoonacular API
- 900,000+ recipes database
- Nutrition information, ingredients, instructions
- Recipe search with complex filtering
- Bulk recipe imports via `npm --prefix backend run import:recipes`

### Google OAuth
- Seamless social login
- Secure token validation
- User profile auto-population

### Email Service (Resend)
- Welcome emails
- Password reset
- Recipe recommendations digest

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Pages: Login, Chat, Planner, Budget, Nutrition  │   │
│  │  Components: RecipeCard, Planner, Charts, Chat   │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / Axios
                           │
        ┌──────────────────┴──────────────────┐
        │  HTTP Request                       │
        ▼                                     ▼
┌─────────────────────────────────────────────────────────┐
│        Backend (Node.js + Express + MongoDB)            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Routes: Auth, AI, Recipes, Users               │   │
│  │  Controllers: Business Logic                    │   │
│  │  Models: User, Recipe, MealPlan, ChatHistory   │   │
│  │  Middleware: JWT Auth, Validation              │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
   │ MongoDB     │  │ Spoonacular  │  │ Google      │
   │ (Data)      │  │ API (Recipes)│  │ OAuth       │
   └─────────────┘  └──────────────┘  └─────────────┘
```

---

## 🚀 Deployment Options

### Option 1: Railway.app
```bash
# Connect your GitHub repo to Railway
# Automatic deploys on push
```

### Option 2: Render
```bash
# Backend on Render, Frontend on Vercel
# See: render.yaml and vercel.json
```

### Option 3: Local Docker (Optional)
```bash
# Future: Add docker-compose.yml for containerization
```

---

## 📊 Features Roadmap

- [x] AI mood-based recommendations
- [x] Meal planning
- [x] Budget meal planner
- [x] Nutrition tracking
- [x] Cooking assistant chatbot
- [x] Recipe comparison
- [ ] Recipe video tutorials
- [ ] Shopping list generator
- [ ] Social sharing (Pinterest, Instagram)
- [ ] Mobile app (React Native)
- [ ] Voice commands
- [ ] Push notifications

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---


---

**Built with ❤️ by the MoodEats team** 
