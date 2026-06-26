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
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import feedRouter from "./routes/feed.routes.js"
import notificationRouter from "./routes/notification.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)

app.use("/api/v1/users", userRouter)
app.use("/api/v1/users/login", authLimiter)
app.use("/api/v1/users/register", authLimiter)

app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/feed", feedRouter)
app.use("/api/v1/notifications", notificationRouter)

app.use(errorHandler)

export { app }
