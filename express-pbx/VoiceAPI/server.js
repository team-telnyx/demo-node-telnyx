import { config as dotenvConfig } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "../.env") });
import express from "express";
import http from "http";
import config from "./config/config.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import { verifyWebhook, logWebhook } from "./middleware/webhookVerification.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const httpServer = http.createServer(app);

// Raw body capture middleware for webhook signature verification
app.use('/voice', express.raw({ type: 'application/json', limit: '10mb' }));

// Regular JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
	res.json({
		service: "Voice API PBX",
		status: "running",
		version: "1.0.0",
		timestamp: new Date().toISOString()
	});
});

// Apply webhook middleware and routes
app.use("/voice", logWebhook, verifyWebhook, voiceRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const port = config.port;
httpServer.listen(port, () => {
	console.log(`=� Voice API PBX server listening on port: ${port}`);
	console.log(`=� Webhook endpoint: ${config.telnyx.baseUrl || `http://localhost:${port}`}/voice/webhook`);
	console.log(`= Health check: http://localhost:${port}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('=� SIGTERM received, shutting down gracefully...');
	httpServer.close(() => {
		console.log('=� Server closed');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('=� SIGINT received, shutting down gracefully...');
	httpServer.close(() => {
		console.log('=� Server closed');
		process.exit(0);
	});
});