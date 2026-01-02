import 'dotenv/config';
import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";

const saltRounds = 10;

const db = new pg.Client({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "CRUD",
    password: process.env.DB_PASSWORD || "",
    port: parseInt(process.env.DB_PORT, 10) || 5432
});
try{
    db.connect();
    console.log('Connected to database');
} catch (err) {
    console.error('Error connecting to database:', err);
}

const app = express();
const PORT = process.env.PORT || 8000; 

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));


// Route to home
app.get("/", (req, res) => {
    res.render("home.ejs");
});

// Route to login 
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
// Route to register
app.get("/register", (req, res) => {
  res.render("register.ejs");
});
// Register user
app.post("/register", async (req, res) => {
    const {email, password} = req.body;
    try {
        // Check if user already exist
        const checkEmail = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (checkEmail.rows.length > 0) {
            res.send("User already exist, Try logging in");
        } else {
            // Hash password and store user in db
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    console.log(err);
                } else {
                     const result = 
                     await db.query(
                       "INSERT INTO users (email, password) VALUES ($1, $2)",
                     [email, hash]
                    );
                    res.redirect("/");
                };
            });
        };
    } catch (error) {
        console.log(error);
    }
});
// Login user
app.post("/login", async (req, res) => {
const email= req.body.email;
const loginPassword = req.body.password;
try {
    // Check if user exist
    const result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [
            email,
        ]
    );
    if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        // Compare hashed passwords
        bcrypt.compare(loginPassword, storedHashedPassword, async (err, result) => {
            if (err) {
                console.log(err);
            } else {
                if (result === true) {
                    res.render("secret.ejs");
                   // console.log("Login successful", result);
                } else {
                    res.send("Incorrect password");
                }
            }
        });
    } else {
        res.send("User not found");
    }
} catch (error) {
    console.log(error);
}
});
// Start server
app.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})