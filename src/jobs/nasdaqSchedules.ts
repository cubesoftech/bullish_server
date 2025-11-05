import prisma from "../helpers/prisma";
import { scheduleJob } from "node-schedule";
import moment from "moment-timezone"
import cron from "node-cron";

export default function initializeNasdaqSchedules() {
    try {
        const timeZone = 'America/New_York'
        const ET = moment().tz('America/New_York');

        // nasdaq schedules on a normal day
        cron.schedule("0 20 * * 1-5", closeNasdaq, {
            timezone: ET.tz()
        })
        cron.schedule("0 4 * * 1-5", openNasdaq, {
            timezone: ET.tz()
        })
        cron.schedule("0 0 * * 6,0", closeNasdaq, {
            timezone: ET.tz()
        })

        // Day after Thanksgiving closes at 1 pm
        cron.schedule("0 13 28 11 *", closeNasdaq, {
            timezone: ET.tz()
        })

        // Christmas Eve closes at 1 pm
        cron.schedule("0 13 24 12 *", closeNasdaq, {
            timezone: ET.tz()
        })

        // Nasdaq holiday closures in 2025
        const holidayClosures = [
            '2025-01-01',  // New Year's Day
            '2025-01-20',  // Martin Luther King Jr. Day
            '2025-02-17',  // Presidents' Day
            '2025-04-18',  // Good Friday
            '2025-05-26',  // Memorial Day
            '2025-06-19',  // Juneteenth National Independence Day
            '2025-07-04',  // Independence Day
            '2025-09-01',  // Labor Day
            '2025-11-27',  // Thanksgiving Day
            '2025-12-25',  // Christmas Day
        ];
        holidayClosures.forEach((holiday) => {
            cron.schedule(`0 16 ${holiday.split('-')[2]} ${holiday.split('-')[1]} *`, closeNasdaq, {
                timezone: ET.tz()
            });
        });
    } catch (error) {
        console.log("Error initializing Nasdaq schedules:", error);
    }
}

const updateNasdaq = async (value: boolean) => {
    await prisma.sitesettings.update({
        where: {
            id: "1"
        },
        data: {
            nasdaq: value
        },
    });
}

const closeNasdaq = async () => {
    await updateNasdaq(false);
    console.log(`[${new Date().toISOString()}] Nasdaq market closed.`);
}
const openNasdaq = async () => {
    await updateNasdaq(true);
    console.log(`[${new Date().toISOString()}] Nasdaq market opened.`);
}