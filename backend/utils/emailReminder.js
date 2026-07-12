require('dotenv').config();
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const getDb = () => {
    try {
        return require('../db');
    } catch (error) {
        console.warn('[Reminder] Database connection is not available yet.');
        return null;
    }
};

const createTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        console.warn('[Reminder] Email credentials are not configured. Skipping reminder delivery.');
        return null;
    }

    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user,
            pass
        }
    });
};

const transporter = createTransporter();

const sendTestReminder = async (to = process.env.TEST_EMAIL || 'sraj713213@gmail.com') => {
    if (!transporter) {
        console.warn('[Reminder] Cannot send test reminder because email credentials are missing.');
        return false;
    }

    try {
        await transporter.sendMail({
            from: '"TransitOps Safety Officer" <no-reply@transitops.com>',
            to,
            subject: 'TransitOps Reminder Test',
            text: 'This is a test reminder from the TransitOps bonus-feature email utility.'
        });

        console.log(`[Reminder] Test email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('[Reminder] Failed to send test email:', error);
        return false;
    }
};

const checkAndSendReminders = async () => {
    const db = getDb();

    if (!db || !db.query) {
        console.warn('[Reminder] Skipping reminder checks because the database layer is unavailable.');
        return [];
    }

    if (!transporter) {
        return [];
    }

    try {
        console.log('Running daily license expiry check...');

        const query = `
            SELECT name, license_number, contact_number, license_expiry_date, email
            FROM Drivers
            WHERE license_expiry_date = CURRENT_DATE + INTERVAL '30 days'
            AND status != 'Suspended'
        `;

        const { rows: expiringDrivers = [] } = await db.query(query);
        const sentDrivers = [];

        for (const driver of expiringDrivers) {
            const mailOptions = {
                from: '"TransitOps Safety Officer" <no-reply@transitops.com>',
                to: driver.email,
                subject: `URGENT: License Expiry Reminder for ${driver.license_number}`,
                text: `Dear ${driver.name},\n\nYour driving license (${driver.license_number}) is set to expire on ${driver.license_expiry_date}. \n\nPlease renew it immediately. Drivers with expired licenses are automatically blocked from trip assignments by the system.\n\nThank you,\nTransitOps Safety Team`
            };

            await transporter.sendMail(mailOptions);
            sentDrivers.push(driver.name);
            console.log(`[Success] Reminder sent to driver: ${driver.name}`);
        }

        return sentDrivers;
    } catch (error) {
        console.error('[Error] Failed to execute email reminder cron:', error);
        return [];
    }
};

let cronTask = null;

const initLicenseCron = () => {
    if (cronTask) {
        return cronTask;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('License expiry cron job not initialized because email credentials are missing.');
        return null;
    }

    cronTask = cron.schedule('0 8 * * *', checkAndSendReminders);
    console.log('License expiry cron job initialized.');
    return cronTask;
};

module.exports = { initLicenseCron, checkAndSendReminders, sendTestReminder };