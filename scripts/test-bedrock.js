/**
 * scripts/test-bedrock.js
 * Quick test to verify AWS Bedrock connection and model access.
 * 
 * Usage: node scripts/test-bedrock.js
 * 
 * NOTE: Reads credentials from environment variables.
 *       Make sure .env.local is configured before running.
 */

require('dotenv').config({ path: '.env.local' });

const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const modelId = process.env.BEDROCK_MODEL_ID || 'global.anthropic.claude-haiku-4-5-20251001-v1:0';

async function testBedrock() {
  try {
    const cmd = new ConverseCommand({
      modelId,
      messages: [{ role: 'user', content: [{ text: 'Say hello in one word' }] }],
      inferenceConfig: { maxTokens: 10 },
    });
    const r = await client.send(cmd);
    const text = r.output?.message?.content?.[0]?.text;
    console.log(`✅ Model: ${modelId}`);
    console.log(`✅ Region: ${process.env.AWS_REGION || 'ap-south-1'}`);
    console.log(`✅ Response: "${text}"`);
    console.log(`✅ Status: SUCCESS`);
  } catch (e) {
    console.error(`❌ ${e.name}: ${e.message}`);
  }
}

testBedrock();
