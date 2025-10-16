function validateEventPayload(payload) {
  const errors = [];
  if (!payload.title || typeof payload.title !== 'string') {
    errors.push("title is required and must be a string");
  }
  if (!payload.datetime || isNaN(Date.parse(payload.datetime))) {
    errors.push("datetime is required and must be in ISO format");
  }
  if (!payload.location || typeof payload.location !== 'string') {
    errors.push("location is required and must be a string");
  }
  if (payload.capacity === undefined || typeof payload.capacity !== 'number') {
    errors.push("capacity is required and must be a number");
  } else {
    if (!Number.isInteger(payload.capacity) || payload.capacity <= 0) {
      errors.push("capacity must be a positive integer");
    }
    if (payload.capacity > 1000) {
      errors.push("capacity must be <= 1000");
    }
  }
  return errors;
}

function validateUserPayload(payload) {
  const errors = [];
  if (!payload.name || typeof payload.name !== 'string') {
    errors.push("name is required and must be a string");
  }
  if (!payload.email || typeof payload.email !== 'string' || !payload.email.includes('@')) {
    errors.push("email is required and must be a valid email string");
  }
  return errors;
}

module.exports = { validateEventPayload, validateUserPayload };
