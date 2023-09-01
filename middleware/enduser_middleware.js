const jwt = require("jsonwebtoken");

const authMiddleware = {};

authMiddleware.authenticate = (req, res, next) => {
  let token = req.header("Authorization");
  console.log(token);
  if (!token || !token.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  token = token.split(" ")[1];
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
