import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import morgan from "morgan"
import config from "./config/index.js"
import logger from "./config/logger.js"
import { generalLimiter, authLimiter } from "./middlewares/rateLimiter.middleware.js"
import { setupSwagger } from "./config/swaggerSetup.js"
import { errorHandler } from "./middlewares/error.middleware.js"

const app = express()

app.use(helmet())
app.use(morgan(config.isDev ? 'dev' : 'combined', {
    stream: { write: (message) => logger.http(message.trim()) }
}))
app.use(generalLimiter)

app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

setupSwagger(app)

//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import videoRouter from "./routes/video.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import designRouter from "./routes/design.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)

app.use("/api/v1/users", userRouter)
app.use("/api/v1/users/login", authLimiter)
app.use("/api/v1/users/register", authLimiter)

app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/designs", designRouter)

app.use(errorHandler)

export { app }
