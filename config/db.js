require("dotenv").config();
const mongoose = require("mongoose");
const uri = process.env.DATABASE_URL;


async function ConnectDB() {
  try {
    await mongoose.connect(uri, {
      dbName: process.env.DBNAME,
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: false,
    });

    console.log("✅ Database connected successfuly ");
  } catch (error) {
    console.log(error)
    console.error("❌ MongoDB connection error:", error);
  }
}

async function closeDB() {
  await mongoose.connection.close();
  console.log("🔌 Mongoose connection closed");
}

module.exports = { ConnectDB  , closeDB };
