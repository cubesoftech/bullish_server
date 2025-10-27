import { io } from "../..";
import { Server, Socket } from "socket.io"
import { DefaultEventsMap } from "socket.io/dist/typed-events"
import prisma from "../../helpers/prisma";
import { scheduleJob } from "node-schedule";
import { subSeconds } from "date-fns";

type SocketType = Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
>;

export default function socketConnection() {

    io.on("connection", async (socket) => {
        socket.on("change_site_settings", async () => {
            io.emit("site_settings_changed")
        })

        await socketTrades(socket)
        await lookOutForChanges(socket)
    })
}

async function socketTrades(socket: SocketType) {
    const [
        nasdaq,
        gold,
        eurusd,
        pltr,
        tsla,
        nvda
    ] = await Promise.all([
        nasdaqTrades(),
        goldTrades(),
        eurusdTrades(),
        pltrTrades(),
        tslaTrades(),
        nvdaTrades(),
    ])

    const job = scheduleJob("0 * * * * *", async () => {
        socket.emit("nasdaq", nasdaq)
        socket.emit("gold", gold)
        socket.emit("eurusd", eurusd)
        socket.emit("pltr", pltr)
        socket.emit("tsla", tsla)
        socket.emit("nvda", nvda)
    })

    job.invoke();

    return job;
}
async function lookOutForChanges(socket: SocketType) {
    while (true) {
        const lastFiveSeconds = subSeconds(new Date(), 5);

        const [
            newMembers,
            newDeposits,
            newWithdrawals,
            newMemberTrades,
            newInquiries,
            onlineUsers
        ] = await Promise.all([
            getNewMembers(lastFiveSeconds),
            getNewTransactions(lastFiveSeconds, "deposit"),
            getNewTransactions(lastFiveSeconds, "withdrawal"),
            getNewMemberTrades(lastFiveSeconds),
            getNewInquiries(lastFiveSeconds),
            getOnlineUsers(lastFiveSeconds),
        ])

        const changes = {
            newmembers: newMembers,
            withdrawals: newWithdrawals,
            deposits: newDeposits,
            membertrades: newMemberTrades,
            inquires: newInquiries,
            trades: newMemberTrades,
            online: onlineUsers,
        }

        // check if any value in changes is greater than 0
        if (Object.values(changes).some(value => value > 0)) {
            socket.emit("observerChanges", changes);
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

// -------------------- SOCKET TRADES FUNCTIONS -------------------- //
const nasdaqTrades = async () => {
    const min_1 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "nasdaq_1_min",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_2 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "nasdaq_2_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_5 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "nasdaq_5_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    return { "1_min": min_1, "3_min": min_2, "5_min": min_5 };
};
const goldTrades = async () => {
    const min_1 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "gold_1_min",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_2 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "gold_2_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_5 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "gold_5_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    return { "1_min": min_1, "3_min": min_2, "5_min": min_5 };
};
const eurusdTrades = async () => {
    const min_1 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "eurusd_1_min",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_2 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "eurusd_2_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_5 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "eurusd_5_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    return { "1_min": min_1, "3_min": min_2, "5_min": min_5 };
};
const pltrTrades = async () => {
    const min_1 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "pltr_1_min",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_2 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "pltr_2_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_5 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "pltr_5_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    return { "1_min": min_1, "3_min": min_2, "5_min": min_5 };
};
const tslaTrades = async () => {
    const min_1 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "tsla_1_min",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_2 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "tsla_2_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_5 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "tsla_5_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    return { "1_min": min_1, "3_min": min_2, "5_min": min_5 };
};
const nvdaTrades = async () => {
    const min_1 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "nvda_1_min",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_2 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "nvda_2_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    const min_5 = await prisma.recenttrades.findMany({
        where: {
            tradinghours: {
                //greater then current tiime
                gte: new Date(),
            },
            type: "nvda_5_mins",
        },
        take: 100,
        orderBy: {
            tradinghours: "desc",
        },
    });
    return { "1_min": min_1, "3_min": min_2, "5_min": min_5 };
};

// -------------------- CHANGES FUNCTIONS -------------------- //
const getNewMembers = async (gte: Date) => {
    const newMembers = await prisma.members.count({
        where: {
            createdAt: {
                gte
            }
        }
    })

    return newMembers;
}
const getNewTransactions = async (gte: Date, type: "deposit" | "withdrawal") => {
    const newTransactions = await prisma.transaction.count({
        where: {
            type,
            createdAt: {
                gte
            }
        }
    })

    return newTransactions;
}
const getNewMemberTrades = async (gte: Date) => {
    const newMemberTrades = await prisma.membertrades.count({
        where: {
            timeExecuted: {
                gte
            }
        }
    })

    return newMemberTrades;
}
const getNewInquiries = async (gte: Date) => {
    const newInquiries = await prisma.inquiries.count({
        where: {
            createdAt: {
                gte
            }
        }
    })

    return newInquiries;
}
const getOnlineUsers = async (gte: Date) => {
    const onlineUsers = await prisma.members.count({
        where: {
            lastOnline: {
                gte
            }
        }
    })

    return onlineUsers;
}