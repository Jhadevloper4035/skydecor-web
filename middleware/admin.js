require("dotenv").config();

async function requireAdmin(req, res, next) {
  const secret = req.header("x-admin-secret");
  
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Admin secret missing or invalid" });
  }
  next();
}

module.exports = requireAdmin;
