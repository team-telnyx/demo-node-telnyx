#!/usr/bin/env node

import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import telnyx from "telnyx";
import axios from "axios";
import { loadDatabase } from "./utils/databaseLoader.js";

// Load .env from current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

// Initialize Telnyx client
const telnyxClient = telnyx(process.env.TELNYX_API_KEY);

// Configure axios for Telnyx API
const telnyxAxios = axios.create({
	baseURL: "https://api.telnyx.com/v2",
	headers: {
		Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
		"Content-Type": "application/json",
	},
});

// Application configurations
const APP_CONFIG = {
	texml: {
		name: "TeXML",
		connectionId: process.env.TELNYX_TEXML_CONNECTION_ID,
		webhookPath: "/texml/inbound",
		requiresSubdomain: true,
		connectionType: "TeXML",
	},
	voiceapi: {
		name: "Voice API",
		connectionId: process.env.TELNYX_VOICEAPI_CONNECTION_ID,
		webhookPath: "/voice/webhook",
		requiresSubdomain: true,
		connectionType: "Call Control",
	},
};

class TelnyxSwitcher {
	constructor() {
		this.baseUrl = process.env.BASE_URL;
		this.subdomain = process.env.SUBDOMAIN;

		if (!this.baseUrl) {
			throw new Error("BASE_URL is required in .env file");
		}

		// Load database for DID management
		try {
			this.database = loadDatabase();
		} catch (error) {
			console.warn(
				"⚠️ Warning: Could not load database for DID management:",
				error.message
			);
			this.database = null;
		}
	}

	// Create readline interface for user input
	createInterface() {
		return readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
	}

	// Get DIDs from database inboundRouting
	getDidsFromDatabase() {
		if (!this.database || !this.database.inboundRouting) {
			return [];
		}

		return this.database.inboundRouting
			.map((route) => route.did)
			.filter((did) => did && did !== "none");
	}

	// Get phone number details from Telnyx
	async getPhoneNumberDetails(phoneNumber) {
		try {
			// Remove + from phone number for API call
			// const cleanNumber = phoneNumber.replace("+", "");
			const response = await telnyxAxios.get(
				`/phone_numbers/${phoneNumber}`
			);
			return response.data.data;
		} catch (error) {
			console.warn(
				`⚠️ Could not get details for ${phoneNumber}:`,
				error.response?.data?.errors?.[0]?.detail || error.message
			);
			return null;
		}
	}

	// Update phone number connection
	async updatePhoneNumberConnection(
		phoneNumber,
		connectionId,
		connectionType
	) {
		try {
			console.log(
				`📞 Updating ${phoneNumber} to use ${connectionType} connection: ${connectionId}`
			);

			// First, get the phone number details to retrieve the ID
			const phoneDetails = await this.getPhoneNumberDetails(phoneNumber);
			if (!phoneDetails) {
				throw new Error(
					`Could not retrieve details for phone number: ${phoneNumber}`
				);
			}

			if (!phoneDetails.id) {
				console.error(
					`Phone number details:`,
					JSON.stringify(phoneDetails, null, 2)
				);
				throw new Error(
					`Phone number ${phoneNumber} does not have a valid ID`
				);
			}

			console.log(`📋 Phone number ID: ${phoneDetails.id}`);
			console.log(`📋 Phone number details:`, {
				id: phoneDetails.id,
				phone_number: phoneDetails.phone_number,
				connection_id: phoneDetails.connection_id,
			});

			const updateData = {
				connection_id: connectionId,
			};

			// Use the phone number ID instead of the phone number for the update
			const response = await telnyxAxios.patch(
				`/phone_numbers/${phoneDetails.id}`,
				updateData
			);
			console.log(`✅ ${phoneNumber} updated successfully`);
			return response.data.data;
		} catch (error) {
			console.error(
				`❌ Error updating ${phoneNumber}:`,
				error.response?.data?.errors?.[0]?.detail || error.message
			);
			throw error;
		}
	}

	// Update all DIDs for the chosen application
	async updateDidsForApplication(appKey) {
		if (!this.database) {
			console.log("💡 Skipping DID updates - no database loaded");
			return;
		}

		const dids = this.getDidsFromDatabase();
		if (dids.length === 0) {
			console.log("💡 No DIDs found in database inboundRouting");
			return;
		}

		const app = APP_CONFIG[appKey];
		console.log(
			`\n📞 Updating ${dids.length} phone number(s) for ${app.name}...`
		);

		let successCount = 0;
		let errorCount = 0;

		for (const did of dids) {
			try {
				await this.updatePhoneNumberConnection(
					did,
					app.connectionId,
					app.connectionType
				);
				successCount++;
			} catch (error) {
				errorCount++;
				// Continue with other DIDs even if one fails
			}
		}

		console.log(`\n📊 DID Update Summary:`);
		console.log(`   ✅ Successfully updated: ${successCount}`);
		if (errorCount > 0) {
			console.log(`   ❌ Failed to update: ${errorCount}`);
		}
	}

	// Get user's choice of application
	async getUserChoice() {
		const rl = this.createInterface();

		return new Promise((resolve) => {
			console.log("\n🔄 Telnyx Application Switcher");
			console.log("===============================");
			console.log("1. TeXML Application");
			console.log("2. Voice API Application");
			console.log("3. Show current configuration");
			console.log("4. Exit");

			rl.question(
				"\nWhich application do you want to activate? (1-4): ",
				(answer) => {
					rl.close();

					switch (answer.trim()) {
						case "1":
							resolve("texml");
							break;
						case "2":
							resolve("voiceapi");
							break;
						case "3":
							resolve("show");
							break;
						case "4":
							resolve("exit");
							break;
						default:
							console.log("❌ Invalid choice. Please try again.");
							resolve(null);
							break;
					}
				}
			);
		});
	}

	// Get TeXML application details using axios
	async getTexmlApplicationDetails(connectionId) {
		try {
			const response = await telnyxAxios.get(
				`/texml_applications/${connectionId}`
			);
			console.log(response.data.data);
			return {
				type: "texml",
				data: response.data.data,
				webhookUrl: response.data.data.voice_url,
				subdomain: response.data.data.inbound.sip_subdomain,
			};
		} catch (error) {
			console.log(
				"Raw TeXML Axios Error:",
				JSON.stringify(error.response?.data || error.message, null, 2)
			);
			throw error;
		}
	}
	async getVoiceApplicationDetails(connectionId) {
		try {
			const response = await telnyxAxios.get(
				`/call_control_applications/${connectionId}`
			);
			
			return {
				type: "voiceAPI",
				data: response.data.data,
				webhookUrl: response.data.data.webhook_event_url,
				subdomain: response.data.data.inbound.sip_subdomain,
			};
		} catch (error) {
			console.log(
				"Raw VoiceAPI Axios Error:",
				JSON.stringify(error.response?.data || error.message, null, 2)
			);
			throw error;
		}
	}

	// Update TeXML application using axios
	async updateTexmlApplicationAxios(connectionId, config) {
		try {
			console.log(
				`📝 Updating TeXML connection via axios: ${connectionId}`
			);
			console.log("Update data:", JSON.stringify(config, null, 2));

			const updateData = {
				voice_url: config.webhookUrl || "",
				inbound: {
					sip_subdomain: config.subdomain || "",
				},
			};

			const response = await telnyxAxios.patch(
				`/texml_applications/${connectionId}`,
				updateData
			);
			console.log(`✅ TeXML connection updated successfully via axios`);
			return response.data.data;
		} catch (error) {
			console.error(
				`❌ Error updating TeXML connection via axios:`,
				error.response?.data || error.message
			);
			throw error;
		}
	}

	// Get connection details from Telnyx (hybrid approach)
	async getConnectionDetails(connectionId, appType) {
		try {
			console.log(`🔍 Fetching connection details for: ${connectionId}`);
			console.log(appType);
			if (appType === "TeXML") {
				console.log(
					`Getting TeXML application details ${connectionId}`
				);
				return await this.getTexmlApplicationDetails(connectionId);
			} else {
				console.log("Getting VoiceAPI application details");
				return await this.getVoiceApplicationDetails(connectionId);
			}
		} catch (error) {
			console.error(
				`❌ Error fetching connection ${connectionId}:`,
				error.message
			);
			throw error;
		}
	}

	// Update TeXML connection (wrapper for axios method)
	async updateTexmlConnection(connectionId, config) {
		return await this.updateTexmlApplicationAxios(connectionId, config);
	}

	// Update Call Control connection using axios
	async updateCallControlConnectionAxios(connectionId, config) {
		try {
			console.log(
				`📝 Updating Call Control connection via axios: ${connectionId}`
			);

			const updateData = {
				webhook_url: config.webhookUrl || "",
				webhook_event_url: config.webhookUrl || "",
				webhook_event_failover_url: "",
				outbound: {
					outbound_voice_profile_id: config.outboundProfileId || "",
				},
				inbound: {
					sip_subdomain: config.subdomain || ""
				}
			};

			
			console.log("Update arguments - connectionId:", connectionId);
			console.log(
				"Update arguments - updateData:",
				JSON.stringify(updateData, null, 2)
			);

			const response = await telnyxAxios.patch(
				`/call_control_applications/${connectionId}`,
				updateData
			);
			console.log(
				`✅ Call Control connection updated successfully via axios`
			);
			return response.data.data;
		} catch (error) {
			console.error(
				`❌ Error updating Call Control connection via axios:`
			);
			if (error.response?.data) {
				console.error("Full error response:", JSON.stringify(error.response.data, null, 2));
				if (error.response.data.errors) {
					error.response.data.errors.forEach((err, index) => {
						console.error(`Error ${index + 1}:`);
						console.error(`  Code: ${err.code}`);
						console.error(`  Title: ${err.title}`);
						console.error(`  Detail: ${err.detail}`);
						if (err.source) {
							console.error(`  Source:`, JSON.stringify(err.source, null, 2));
						}
						if (err.meta) {
							console.error(`  Meta:`, JSON.stringify(err.meta, null, 2));
						}
					});
				}
			} else {
				console.error("Error message:", error.message);
			}
			throw error;
		}
	}

	// Update Call Control connection (wrapper for axios method)
	async updateCallControlConnection(connectionId, config) {
		console.log(`-------Updating Call Control connection ${connectionId}`);
		return await this.updateCallControlConnectionAxios(
			connectionId,
			config
		);
	}

	// Clear connection configuration
	async clearConnection(appKey) {
		const app = APP_CONFIG[appKey];
		console.log(`🧹 Clearing configuration for ${app.name}...`);

		try {
			const details = await this.getConnectionDetails(
				app.connectionId,
				app.connectionType
			);

			if (details.type === "texml") {
				await this.updateTexmlConnection(app.connectionId, {
					webhookUrl: "http://none.com",
					subdomain: "",
				});
			} else if (details.type === "voiceAPI") {
				await this.updateCallControlConnection(app.connectionId, {
					webhookUrl: "http://none.com",
					subdomain: "",
				});
			}

			console.log(`✅ ${app.name} configuration cleared`);
		} catch (error) {
			console.error(
				`❌ Error clearing ${app.name} configuration:`,
				error.message
			);
		}
	}

	// Configure connection for active use
	async configureConnection(appKey) {
		const app = APP_CONFIG[appKey];
		const webhookUrl = `${this.baseUrl}${app.webhookPath}`;

		console.log(`⚙️ Configuring ${app.name} for active use...`);

		try {
			const details = await this.getConnectionDetails(
				app.connectionId,
				app.connectionType
			);

			if (details.type === "texml") {
				await this.updateTexmlConnection(app.connectionId, {
					webhookUrl: webhookUrl,
					subdomain: app.requiresSubdomain ? this.subdomain : "",
				});
			} else if (details.type === "voiceAPI") {
				await this.updateCallControlConnection(app.connectionId, {
					webhookUrl: webhookUrl,
					subdomain: app.requiresSubdomain ? this.subdomain : "",
				});
			}

			console.log(`✅ ${app.name} configured successfully`);
			console.log(`   📡 Webhook URL: ${webhookUrl}`);
			if (app.requiresSubdomain && this.subdomain) {
				console.log(`   🌐 SIP Subdomain: ${this.subdomain}`);
			}
		} catch (error) {
			console.error(`❌ Error configuring ${app.name}:`, error.message);
			throw error;
		}
	}

	// Show current configuration
	async showCurrentConfiguration() {
		console.log("\n📊 Current Telnyx Configuration");
		console.log("================================");

		for (const [key, app] of Object.entries(APP_CONFIG)) {
			try {
				console.log(`\n${app.name} (${app.connectionId}):`);
				const details = await this.getConnectionDetails(
					app.connectionId,
					app.connectionType
				);

				console.log(`   Type: ${details.type}`);
				console.log(
					`   Webhook URL: ${details.webhookUrl || "(not set)"}`
				);
				if (details.subdomain !== undefined) {
					console.log(
						`   SIP Subdomain: ${details.subdomain || "(not set)"}`
					);
				}

				// Determine if this connection is active
				const expectedWebhook = `${this.baseUrl}${app.webhookPath}`;
				const isActive = details.webhookUrl === expectedWebhook;
				console.log(
					`   Status: ${isActive ? "🟢 ACTIVE" : "🔴 INACTIVE"}`
				);
			} catch (error) {
				console.log(`   ❌ Error: ${error.message}`);
			}
		}

		// Show current DID assignments
		if (this.database) {
			const dids = this.getDidsFromDatabase();
			if (dids.length > 0) {
				console.log(`\n📞 Phone Number Assignments`);
				console.log("============================");

				for (const did of dids) {
					try {
						const phoneDetails = await this.getPhoneNumberDetails(
							did
						);
						if (phoneDetails) {
							const currentConnection =
								phoneDetails.connection_id;
							let connectionName = "Unknown";
							let connectionType = "Unknown";

							// Find which app this connection belongs to
							for (const [key, app] of Object.entries(
								APP_CONFIG
							)) {
								if (app.connectionId === currentConnection) {
									connectionName = app.name;
									connectionType = app.connectionType;
									break;
								}
							}

							console.log(
								`   ${did}: ${connectionName} (${connectionType})`
							);
						}
					} catch (error) {
						console.log(`   ${did}: ❌ Error checking assignment`);
					}
				}
			}
		}
	}

	// Check for configuration conflicts
	async checkForConflicts(targetApp) {
		const conflicts = [];
		const targetConfig = APP_CONFIG[targetApp];
		const expectedWebhook = `${this.baseUrl}${targetConfig.webhookPath}`;

		for (const [key, app] of Object.entries(APP_CONFIG)) {
			if (key === targetApp) continue;

			try {
				const details = await this.getConnectionDetails(
					app.connectionId,
					app.connectionType
				);

				// Check for webhook conflicts
				if (
					details.webhookUrl &&
					details.webhookUrl.includes(this.baseUrl)
				) {
					conflicts.push({
						app: key,
						type: "webhook",
						value: details.webhookUrl,
					});
				}

				// Check for subdomain conflicts (for TeXML)
				if (
					targetConfig.requiresSubdomain &&
					details.subdomain === this.subdomain
				) {
					conflicts.push({
						app: key,
						type: "subdomain",
						value: details.subdomain,
					});
				}
			} catch (error) {
				console.warn(
					`⚠️ Could not check conflicts for ${app.name}: ${error.message}`
				);
			}
		}

		return conflicts;
	}

	// Switch to specified application
	async switchToApplication(appKey) {
		if (!APP_CONFIG[appKey]) {
			throw new Error(`Invalid application: ${appKey}`);
		}

		const app = APP_CONFIG[appKey];
		console.log(`\n🔄 Switching to ${app.name}...`);

		try {
			// Check for conflicts
			console.log("🔍 Checking for configuration conflicts...");
			const conflicts = await this.checkForConflicts(appKey);
			console.log(`📋 Found ${conflicts.length} conflicts:`, JSON.stringify(conflicts, null, 2));

			// Clear conflicting configurations
			if (conflicts.length > 0) {
				console.log(
					`⚠️ Found ${conflicts.length} conflict(s), clearing...`
				);
				for (const conflict of conflicts) {
					await this.clearConnection(conflict.app);
				}
			}

			// Configure the target application
			await this.configureConnection(appKey);

			// Update DIDs to use the new connection
			await this.updateDidsForApplication(appKey);

			console.log(`\n🎉 Successfully switched to ${app.name}!`);
			console.log(`\nYou can now start the ${app.name} application:`);
			if (appKey === "texml") {
				console.log(`   npm run texml`);
			} else {
				console.log(`   npm run voiceapi`);
			}
		} catch (error) {
			console.error(`❌ Failed to switch to ${app.name}:`, error.message);
			throw error;
		}
	}

	// Validate environment configuration
	validateEnvironment() {
		const required = ["TELNYX_API_KEY", "BASE_URL"];
		const missing = required.filter((key) => !process.env[key]);

		if (missing.length > 0) {
			throw new Error(
				`Missing required environment variables: ${missing.join(", ")}`
			);
		}

		// Check connection IDs
		for (const [key, app] of Object.entries(APP_CONFIG)) {
			if (!app.connectionId) {
				throw new Error(
					`Missing connection ID for ${
						app.name
					}: ${key.toUpperCase()}_CONNECTION_ID`
				);
			}
		}

		// Warn about subdomain for TeXML
		if (APP_CONFIG.texml.requiresSubdomain && !this.subdomain) {
			console.warn(
				"⚠️ Warning: SUBDOMAIN not set. TeXML application may not work correctly for SIP calls."
			);
		}
	}

	// Main execution flow
	async run() {
		try {
			this.validateEnvironment();

			while (true) {
				const choice = await this.getUserChoice();

				if (!choice) {
					continue; // Invalid choice, ask again
				}

				if (choice === "exit") {
					console.log("👋 Goodbye!");
					process.exit(0);
				}

				if (choice === "show") {
					await this.showCurrentConfiguration();
					continue;
				}

				// Switch to chosen application
				await this.switchToApplication(choice);
				break;
			}
		} catch (error) {
			console.error("❌ Switcher error:", error.message);
			process.exit(1);
		}
	}
}

// Run the switcher if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const switcher = new TelnyxSwitcher();
	switcher.run();
}
