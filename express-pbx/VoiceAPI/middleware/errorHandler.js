export const errorHandler = (err, req, res, next) => {
	console.error("❌ Unhandled error:", err);

	// Telnyx API errors
	if (err.response && err.response.data) {
		console.error("Telnyx API Error:", err.response.data);
		return res.status(err.response.status || 500).json({
			error: "Telnyx API error",
			details: err.response.data
		});
	}

	// Validation errors
	if (err.name === 'ValidationError') {
		return res.status(400).json({
			error: "Validation error",
			details: err.message
		});
	}

	// Default error response
	res.status(500).json({
		error: "Internal server error",
		message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
	});
};

export const notFoundHandler = (req, res) => {
	res.status(404).json({
		error: "Route not found",
		path: req.path,
		method: req.method
	});
};