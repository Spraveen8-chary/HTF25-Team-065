# Automated Caption Generator

Effortlessly add accurate, AI-powered captions to your videos in 40+ languages. Built as a ready-to-deploy SaaS web app with multi-user support, advanced admin dashboard, and premium gating.

***

## 🚀 Features

- 🎥 Video-to-caption generation for MP4, MOV, AVI, MKV, WebM files
- 🌍 40+ languages including English, Hindi, Tamil, Telugu, Bengali, and more
- ✨ Multiple caption styles at once: Meme, Formal, Casual, Aesthetic
- 🪄 AI transcription/translation powered by Google Gemini 2.5 Flash
- 🧑‍💻 User dashboard with authentication and usage limits (2 free videos)
- 💳 Premium accounts with unlimited uploads
- 📈 Admin dashboard: full analytics, user management, charts, all activity
- 📦 Easy deployment (Flask, SQLite, SQLAlchemy, Chart.js)
- 🎨 Modern, responsive, animated UI

***

## 📸 Output Screenshots
1. Register Page
   <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/632c23fb-798d-41c6-95c2-d7aeab447a40" />
2. Login Page
   <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/88788f44-73e2-47ff-8538-f1843476e511" />
3. Home Page
   <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/dd0f0b68-5067-4f7b-b89d-bdf30f585382" />
4. Options
   ![WhatsApp Image 2025-10-25 at 21 31 55_b599a96b](https://github.com/user-attachments/assets/1b300995-a7fe-4bd7-99d9-edc03a620d29)
5. Results
   ![WhatsApp Image 2025-10-25 at 21 32 43_3b868f6c](https://github.com/user-attachments/assets/58663f34-8c68-4e56-8e38-079e5229099f)
6. Exporting
   ![WhatsApp Image 2025-10-25 at 21 33 15_1d50342d](https://github.com/user-attachments/assets/e962607d-141d-48e6-8397-acfc57d5e3bd)
7. Reaching Subscription Limit
   ![WhatsApp Image 2025-10-25 at 21 39 57_d8d21ffc](https://github.com/user-attachments/assets/2d6f91c4-6104-4ff3-9381-ccec2419c90f)




***

## 🗂️ Project Structure

```
caption-generator/
├── app.py
├── auth.py
├── models.py
├── config.py
├── requirements.txt
├── .env          # (Not committed, for secrets)
├── utils/
│   ├── transcription.py
│   ├── video_processor.py
│   └── caption_formatter.py
├── static/
│   ├── css/
│   │   ├── style.css
│   │   ├── animations.css
│   │   └── admin.css
│   ├── js/
│   │   ├── main.js
│   │   └── auth.js
│   └── uploads/
├── templates/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── history.html
│   └── admin_dashboard.html
```


***

## ⚙️ Quickstart

### 1. Clone and Setup

```sh
git clone https://github.com/Spraveen8-chary/HTF25-Team-065.git
cd caption-generator
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```


### 2. Environment

Create a `.env` file in the project root:

```
FLASK_SECRET_KEY=your-flask-secret-here
GOOGLE_API_KEY=your_google_gemini_api_key
MAX_UPLOAD_SIZE=100
ALLOWED_EXTENSIONS=mp4,mov,avi,mkv,webm
TEMP_FOLDER=uploads
DATABASE_URL=sqlite:///caption_generator.db
```

- Get your Google API Key at https://aistudio.google.com/app/apikey


### 3. Run

```sh
python app.py
# or for production: gunicorn app:app
```

- Visit: http://localhost:5000

***

## 👤 Default Admin Credentials

- **Email:** admin@caption.generator.com
- **Password:** Praveen8

Admin users are auto-created on first run if not present.

***

## 🧑‍💼 Admin Features

- See all users
- View detailed video+caption history for every user
- See registration and processing trends with charts (Chart.js)
- Download any generated SRT
- Monthly and all-time analytics for growth and usage

***

## 🧑 User Features

- Register/Login with email
- Upload video, select multiple caption styles and language
- Download professional, stylized SRT files
- Usage limits (2 free videos) with animated UI
- Upgrade to premium for unlimited use

***

## 🛠️ Tech Stack

- Backend: **Python Flask**, SQLAlchemy, SQLite
- AI: **Google Gemini 2.5 Flash** (via google-genai SDK)
- Frontend: HTML5, CSS3, JS, Chart.js, modern SPA patterns
- Auth: Flask-Login
- Responsive, animated, and optimized for SaaS

***

## 💡 Tips \& Migrations

- If you add columns to models (like `is_admin`), use Flask-Migrate for production, or `ALTER TABLE` for SQLite, or just delete and let the app recreate the DB for fresh installs.
- Production deployment: use Gunicorn/uwsgi, set secret keys, and HTTPS.


***

**Made with ❤️ for content creators.**
If you use this, star the repo and consider contributing!
