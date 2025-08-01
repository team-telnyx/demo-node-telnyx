// Strategy configuration mapping
export const STRATEGY_CONFIG = {
	null: {
		contextTypeMap: {
			"sip->sip": "ext2ext",
			"pstn->sip": "pstn-inbound", 
			"sip->pstn": "pstn-outbound"
		},
		defaultContext: "ext2ext"
	},
	simultaneous: {
		contextType: "simultaneous"
	},
	sequential: {
		contextType: "sequential"
	}
};

// Context type determination utility
export const determineContextType = (callingPartyType, destinationPartyType, strategy) => {
	if (strategy === null) {
		const key = `${callingPartyType}->${destinationPartyType}`;
		return STRATEGY_CONFIG.null.contextTypeMap[key] || STRATEGY_CONFIG.null.defaultContext;
	}
	
	return STRATEGY_CONFIG[strategy]?.contextType || strategy;
};

// Destination processing utility
export const processDestinations = (to) => {
	return Array.isArray(to) ? to : [to];
};