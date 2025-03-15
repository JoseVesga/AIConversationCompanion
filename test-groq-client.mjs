// Test Groq client instantiation
import Groq from 'groq';

// Print Groq constructor
console.log('Groq constructor type:', typeof Groq);

// Try constructing a client
try {
  const client = new Groq('test-api-key');
  console.log('Client created successfully');
  console.log('Client methods:', Object.keys(client));
} catch (error) {
  console.error('Error creating client:', error.message);
}

// Try alternative construction
try {
  const client2 = Groq('test-api-key');
  console.log('Alternative client created successfully');
  console.log('Alternative client methods:', Object.keys(client2));
} catch (error) {
  console.error('Error creating alternative client:', error.message);
}