// Context management for call state following server2.js pattern
// Client state structure based on server2.js:
// {
//   remainingDestinations: [...] || null
//   currentState: 'sequential' || 'voicemail' || 'null' || 'pstn-outbound' || 'pstn-inbound' || 'ext2ext' || 'simultaneous'
//   step: 1 || null
//   totalSteps: 3 || null
//   relatedCalls: [call_control_id]
// }

export const createContext = (state, relatedCalls, remainingDestinations = null, step = null, totalSteps = null, routeInfo = null) => {
	return {
		remainingDestinations,
		currentState: state,
		step,
		totalSteps,
		relatedCalls: Array.isArray(relatedCalls) ? relatedCalls : [relatedCalls],
		routeInfo
	};
};

export const updateContext = (context, updates) => {
	return {
		...context,
		...updates
	};
};

export const getNextDestination = (context) => {
	if (!context.remainingDestinations || context.remainingDestinations.length === 0) {
		return null;
	}
	return context.remainingDestinations[0];
};

export const removeFirstDestination = (context) => {
	if (!context.remainingDestinations || context.remainingDestinations.length === 0) {
		return context;
	}
	
	const [, ...remaining] = context.remainingDestinations;
	return updateContext(context, {
		remainingDestinations: remaining,
		step: context.step ? context.step + 1 : 1
	});
};

export const hasMoreDestinations = (context) => {
	return context.remainingDestinations && context.remainingDestinations.length > 0;
};