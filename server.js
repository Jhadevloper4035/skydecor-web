require("dotenv").config();
const app = require("./index.js");
const PORT = process.env.PORT || 8000;

const { ConnectDB } = require("./config/db.js");

// connect database
ConnectDB();

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
