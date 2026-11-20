# Student CRUD REST API - Node.js + Express + MongoDB

REST API that performs Create, Read, Update and Delete on a `students` collection in MongoDB Atlas (Mongoose). Deployed on Render and tested with Postman.

Live: https://student-crud-api-aoep.onrender.com

API base: https://student-crud-api-aoep.onrender.com/api/students

> Hosted on Render's free tier, so the first request after a period of inactivity can take 30-60 seconds while the service wakes up.

## Run locally
    npm install
    copy .env.example .env     # add your MONGODB_URI
    npm start                  # http://localhost:3000

## Endpoints
| Method | URL | Purpose | Success |
|---|---|---|---|
| GET | `/api/students` | list (`?course=&minCgpa=&q=&sort=&page=`) | 200 |
| GET | `/api/students/:id` | read one | 200 |
| POST | `/api/students` | create | 201 |
| PUT | `/api/students/:id` | update (name, email, course required) | 200 |
| PATCH | `/api/students/:id` | partial update | 200 |
| DELETE | `/api/students/:id` | delete | 200 |
| GET | `/health` | health check | 200 |

Errors: `400` bad id / malformed JSON, `404` not found, `409` duplicate email, `422` validation failed.

Student body:

    { "name": "Asha Patil", "email": "asha@example.com", "age": 20, "course": "Computer Engineering", "cgpa": 8.5 }

Validation: `name`, `email` and `course` are required; `email` must be valid and unique; `age` 15-100; `cgpa` 0-10.

## Example (curl)
    curl https://student-crud-api-aoep.onrender.com/api/students
    curl -X POST https://student-crud-api-aoep.onrender.com/api/students -H "Content-Type: application/json" -d "{\"name\":\"Asha Patil\",\"email\":\"asha@example.com\",\"course\":\"Computer Engineering\"}"

## Project files
- `server.js` - connects to MongoDB and starts the server
- `app.js` - Express routes, input whitelisting and error handling
- `models.js` - Mongoose `Student` schema
- `postman_collection.json` - Postman collection with test scripts
- `render.yaml` - Render deployment config

## Deploy on Render
1. Create a free MongoDB Atlas cluster, a database user, and allow network access `0.0.0.0/0`. Copy the connection string.
2. Push this repo to GitHub.
3. On render.com: New > Web Service > pick the repo, **Root Directory** `Assignment_6`, Build `npm install --omit=dev`, Start `npm start` (or use the included `render.yaml` as a Blueprint).
4. Add the environment variable `MONGODB_URI` and deploy.
5. Open `https://<your-service>.onrender.com/health` - it should return `ok`.

## Test with Postman
1. In Postman open the **Collections** view and click **Import** (do not open the folder in Local Mode), then choose `postman_collection.json`.
2. The collection variable `baseUrl` is already set to the Render URL. Use `http://localhost:3000` to test a local server.
3. Send **Health check** once to wake the server, then run the collection with the Collection Runner. Each request has test scripts and the created id is stored automatically, so all 11 requests (create, validation errors, duplicate, read, PUT, PATCH, delete, 404, bad id) should pass.
4. Take screenshots of each request/response for the report.
