#!/usr/bin/env node
require('dotenv').config();
const { sendTestReminder } = require('./emailReminder');

const recipient = process.argv[2] || process.env.TEST_EMAIL || 'sraj713213@gmail.com';

(async () => {
  const sent = await sendTestReminder(recipient);
  process.exit(sent ? 0 : 1);
})();
