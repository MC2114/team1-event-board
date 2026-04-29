import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({

  url: "file:./prisma/dev.db",

});

const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.rSVP.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.createMany({
        data: [
        {
            id: "user-reader",
            email: "user@app.test",
            displayName: "Una User",
            role: "user",
            passwordHash: "password123",
        },
        {
            id: "user-staff",
            email: "staff@app.test",
            displayName: "Sam Staff",
            role: "staff",
            passwordHash: "password123",
        },
        {
            id: "user-admin",
            email: "admin@app.test",
            displayName: "Avery Admin",
            role: "admin",
            passwordHash: "password123",
        },
        ],
    });

    const now = new Date();
    const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const oneYearAndTwoHours = new Date(oneYear.getTime() + 2 * 60 * 60 * 1000);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAndThreeHours = new Date(thirtyDays.getTime() + 3 * 60 * 60 * 1000);
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAndOneHour = new Date(sevenDays.getTime() + 60 * 60 * 1000);

    await prisma.event.createMany({
        data: [
            {
                id: "event-published-1",
                title: "Spring Picnic",
                description: "Food, games, and fun on the lawn.",
                location: "Campus Pond Lawn",
                category: "party",
                status: "published",
                capacity: 25,
                startDatetime: oneYear,
                endDatetime: oneYearAndTwoHours,
                organizerId: "user-staff",
            },
            {
                id: "event-published-2",
                title: "Graduation Celebration",
                description: "Come congratulate our Seniors.",
                location: "Boston, MA",
                category: "graduation",
                status: "published",
                capacity: 100,
                startDatetime: thirtyDays,
                endDatetime: thirtyDaysAndThreeHours,
                organizerId: "user-admin",
            },
            {
                id: "event-published-3",
                title: "Startup Networking Night",
                description: "Meet founders and investors.",
                location: "Innovation Hub",
                category: "business",
                status: "published",
                capacity: 40,
                startDatetime: sevenDays,
                endDatetime: sevenDaysAndOneHour,
                organizerId: "user-staff",
            },
            {
                id: "event-draft-1",
                title: "Draft Planning Meeting",
                description: "This is still a draft event.",
                location: "Student Union 201",
                category: "networking",
                status: "draft",
                capacity: 10,
                startDatetime: sevenDays,
                endDatetime: sevenDaysAndOneHour,
                organizerId: "user-staff",
            },
            {
                id: "event-draft-admin",
                title: "Admin Draft Event",
                description: "A draft owned by admin for cross-organizer testing.",
                location: "Admin Office",
                category: "networking",
                status: "draft",
                capacity: 10,
                startDatetime: oneYear,
                endDatetime: oneYearAndTwoHours,
                organizerId: "user-admin",
            },
            {
                id: "event-cancelled-1",
                title: "Cancelled Hackathon",
                description: "This event has been cancelled.",
                location: "Engineering Hall",
                category: "technology",
                status: "cancelled",
                capacity: 50,
                startDatetime: sevenDays,
                endDatetime: sevenDaysAndOneHour,
                organizerId: "user-staff",
            },
            {
                id: "event-past-1",
                title: "Past Music Night",
                description: "An old music event that already happened.",
                location: "Campus Auditorium",
                category: "music",
                status: "published",
                capacity: 75,
                startDatetime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                endDatetime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
                organizerId: "user-admin",
            },
        ],
    });

    console.log("Database seeded successfully.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());