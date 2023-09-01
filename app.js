require("dotenv").config();
require("express-async-errors");

// extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

const express = require("express");
const app = express();

//connect DB
const connectDB = require("./db/connect");

const authenticateUser = require("./middleware/authentication");

// routers
const authRouter = require("./routes/auth");
const jobsRouter = require("./routes/jobs");
const enduserRouter = require("./routes/enduser");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.set("trust proxy", 1);

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

app.get("/", (req, res) => {
  res.send("api index");
});

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/enduser", enduserRouter);

app.use("/api/v1/uuids", authenticateUser, jobsRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
const allRoutes = [];
const enduserRoutes = [];

enduserRouter.stack.forEach((middleware) => {
  if (middleware.route) {
    const methods = Object.keys(middleware.route.methods).join(", ");
    const path = middleware.route.path;
    enduserRoutes.push({ path, methods });
  }
});

console.log("List of enduser routes:", enduserRoutes);

app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    const methods = Object.keys(middleware.route.methods).join(", ");
    const path = middleware.route.path;
    allRoutes.push({ path, methods });
  } else if (middleware.name === "router") {
    middleware.handle.stack.forEach((handler) => {
      const route = handler.route;
      const methods = Object.keys(route.methods).join(", ");
      const path = route.path;
      allRoutes.push({ path, methods });
    });
  }
});
console.log("List of all endpoints:", allRoutes);
const port = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
