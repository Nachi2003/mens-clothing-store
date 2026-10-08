# UNIQUE ZONE – The Fashion Garage

Full-stack men's clothing e-commerce website.

## Technologies
- Frontend: React, TypeScript, Vite, CSS
- Backend: Java, Spring Boot, REST API
- Database: MySQL
- Tools: Git, GitHub, Maven

## Features
- Customer registration and login
- Product browsing and details
- Shopping cart and checkout
- Order history and customer profile
- Product images and inventory

## How to Run

**1. Clone the repository**
```bash
git clone https://github.com/Nachi2003/mens-clothing-store.git
cd mens-clothing-store
```

**2. Start the backend**

Configure MySQL in `backend/src/main/resources/application.properties`, then run:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**3. Start the frontend** in a second terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Then run:

```powershell
npm run dev
```

Open `http://localhost:5173`.

## Requirements
Install Git, Node.js, Java JDK, and MySQL. Ensure the required database schema and data are available before running the application. Never commit passwords or `.env` files.