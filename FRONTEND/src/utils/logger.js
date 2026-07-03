// Production structured logger



let globalCorrelationIds = {};

export const Logger = {
  setCorrelationIds: (ids) => {
    globalCorrelationIds = { ...globalCorrelationIds, ...ids };
  },
  info: (event, metadata = {}) => {
    log('INFO', event, metadata);
  },
  warn: (event, metadata = {}) => {
    log('WARN', event, metadata);
  },
  error: (event, error, metadata = {}) => {
    log('ERROR', event, { ...metadata, error: error?.message || error, stack: error?.stack });
  },
  metric: (event, value, metadata = {}) => {
    log('METRIC', event, { value, ...metadata });
  }
};

function log(level, event, metadata) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    metadata,
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...globalCorrelationIds // Inject Correlation IDs
  };

  // Future-proof transport abstraction (e.g. Datadog, CloudWatch)
  if (window.Datadog) {
    // window.Datadog.logger.log(event, payload);
  }

  // In production, this would be batched and sent to Datadog/Sentry/NewRelic via an API endpoint.
  // For now, we log to console in a structured JSON format.
  if (import.meta.env.MODE !== 'production') {
    if (level === 'ERROR') {
      console.error(`[${level}] ${event}`, payload);
    } else if (level === 'WARN') {
      console.warn(`[${level}] ${event}`, payload);
    } else {
      console.log(`[${level}] ${event}`, payload);
    }
  } else {
    // Basic console serialization for cloud watch/log agents
    console.log(JSON.stringify(payload));
  }
}
