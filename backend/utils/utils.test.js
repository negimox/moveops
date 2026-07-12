const test = require('node:test');
const assert = require('node:assert/strict');

const { jsonToCsv } = require('./exportService');
const { initLicenseCron, checkAndSendReminders, sendTestReminder } = require('./emailReminder');

test('jsonToCsv escapes values and includes the full header set', () => {
  const csv = jsonToCsv([
    { name: 'Jane "Doe"', amount: 1200, note: 'line 1\nline 2' },
    { name: 'John', amount: 250, note: '' }
  ]);

  assert.match(csv, /name,amount,note/);
  assert.match(csv, /"Jane ""Doe"""/);
  assert.match(csv, /line 1\\nline 2/);
});

test('email reminder utility loads and runs safely without a database module', async () => {
  assert.equal(typeof initLicenseCron, 'function');
  assert.equal(typeof checkAndSendReminders, 'function');
  await assert.doesNotReject(checkAndSendReminders());
});

test('sendTestReminder succeeds with configured email credentials', async () => {
  assert.equal(typeof sendTestReminder, 'function');
  // EMAIL_USER and EMAIL_PASS are set in .env — expect successful send (true)
  const result = await sendTestReminder();
  assert.equal(result, true);
});
