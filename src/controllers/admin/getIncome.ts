import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { members_role } from "@prisma/client";
import { all } from "axios";

export default async function getIncome(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }
    const { month, role, id } = req.query

    const processedMonth = parseInt(month as string) || new Date().getMonth() + 1
    const processedRole = role ? role as string : "ADMIN"
    const processedId = id ? id as string : user.id

    const acceptedRoles: members_role[] = ["ADMIN", "AGENT", "MASTER_AGENT"]
    if (!acceptedRoles.includes(processedRole as members_role)) {
        return next({
            status: 400,
            message: "Invalid role"
        })
    }

    try {

        if (processedRole === "AGENT") {
            const user = await getAgentTransactions({ month: processedMonth, agentId: processedId })

            return res.status(200).json({ data: user })
        }

        if (processedRole === "MASTER_AGENT") {
            const memberUser = await prisma.members.findUnique({
                where: {
                    id: processedId
                }
            })
            if (!memberUser) {
                return next({
                    status: 404,
                    message: "Member not found"
                })
            }

            const user = await getMasterAgentTransactions({ month: processedMonth, masterAgentId: processedId })

            return res.status(200).json({ data: user })
        }

        const users = await getAllTransactions({ month: processedMonth })
        users.users.map((user, index) => {
            const { referrer, masterAgentID } = user
            if (referrer === masterAgentID) {
                users.totalMasterAgentNetIncome += user.agent_net_income;
                users.totalAgentGrossIncome += user.agent_net_income;
                users.totalAgentNetIncome += user.agent_gross_income;
                users.users[index].agent_gross_income = 0;
                users.users[index].agent_net_income = 0;
                users.users[index].master_agent_net_income += user.agent_net_income
            }
        })

        return res.status(200).json({ data: users })
    } catch (error) {
        console.log("Error admin | getIncome: ", error)
        return next();
    }
}

const getMasterAgentTransactions = async ({ month, masterAgentId }: { month: number; masterAgentId: string }) => {
    const masterAgent = await prisma.masteragents.findFirst({
        where: {
            memberId: masterAgentId
        }
    })
    if (!masterAgent) {
        return {
            totalOperatorGrossIncome: 0,
            totalOperatorNetIncome: 0,
            totalAgentGrossIncome: 0,
            totalAgentNetIncome: 0,
            totalMasterAgentGrossIncome: 0,
            totalMasterAgentNetIncome: 0,
            users: [],
        };
    }


    const users = await getAllTransactions({ month })
    const masterAgents = users.users.filter(user => user.agents?.masteragents.memberId === masterAgent.id)

    const withdrawal = await prisma.agents_withdrawals.aggregate({
        where: {
            membersId: masterAgentId,
            status: "completed"
        },
        _sum: {
            amount: true
        }
    })
    const totalWithdrawalAmount = withdrawal._sum.amount || 0;

    users.totalMasterAgentGrossIncome = masterAgents.reduce(
        (sum, user) => sum + user.master_agent_gross_income,
        0
    );
    users.totalMasterAgentNetIncome = masterAgents.reduce(
        (sum, user) => sum + user.master_agent_net_income,
        0
    );
    users.totalOperatorGrossIncome = masterAgents.reduce(
        (sum, user) => sum + user.operator_gross_income,
        0
    );
    users.totalOperatorNetIncome = masterAgents.reduce(
        (sum, user) => sum + user.operator_net_income,
        0
    );
    users.totalAgentGrossIncome = masterAgents.reduce(
        (sum, user) => sum + user.agent_gross_income,
        0
    );
    users.totalAgentNetIncome = masterAgents.reduce(
        (sum, user) => sum + user.agent_net_income,
        0
    );
    users.users = masterAgents;

    users.totalMasterAgentNetIncome -= totalWithdrawalAmount;
    return {
        ...users,
        withdrawal: withdrawal._sum.amount || 0
    };
}

const getAgentTransactions = async ({ month, agentId }: { month: number; agentId: string }) => {
    const users = await getAllTransactions({ month })
    const masterAgents = users.users.filter(user => user.agents?.memberId === agentId)

    const withdrawal = await prisma.agents_withdrawals.aggregate({
        where: {
            membersId: agentId,
            status: "completed"
        },
        _sum: {
            amount: true
        }
    })
    const totalWithdrawalAmount = withdrawal._sum.amount || 0;

    users.totalMasterAgentGrossIncome = masterAgents.reduce(
        (sum, user) => sum + user.master_agent_gross_income,
        0
    );
    users.totalMasterAgentNetIncome = masterAgents.reduce(
        (sum, user) => sum + user.master_agent_net_income,
        0
    );
    users.totalOperatorGrossIncome = masterAgents.reduce(
        (sum, user) => sum + user.operator_gross_income,
        0
    );
    users.totalOperatorNetIncome = masterAgents.reduce(
        (sum, user) => sum + user.operator_net_income,
        0
    );
    users.totalAgentGrossIncome = masterAgents.reduce(
        (sum, user) => sum + user.agent_gross_income,
        0
    );
    users.totalAgentNetIncome = masterAgents.reduce(
        (sum, user) => sum + user.agent_net_income,
        0
    );
    users.users = masterAgents;

    users.totalAgentNetIncome -= totalWithdrawalAmount;
    return {
        ...users,
        withdrawal: withdrawal._sum.amount || 0
    };
}

const getAllTransactions = async ({ month }: { month: number }) => {
    const users = await prisma.members.findMany({
        where: {
            role: "USER",
            email: {
                not: {
                    contains: "test",
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            name: true,
            balance: true,
            referrer: true,
            agents: {
                select: {
                    masteragents: {
                        select: {
                            id: true,
                            royalty: true,
                            memberId: true,
                        },
                    },
                    royalty: true,
                    memberId: true,
                },
            },
            transaction: {
                select: {
                    amount: true,
                    type: true,
                    createdAt: true,
                },
                where: {
                    status: "completed",
                    type: "deposit",
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), month - 1, 1),
                        lt: new Date(new Date().getFullYear(), month, 1),
                    },
                },
            },
        },
    })

    const processedUsers = await Promise.all(
        users.map(async (user) => {
            let masterAgentID: string | null = null;
            const masteragentid = user.agents?.masteragents?.memberId || "";
            const memberMAsterAgent = await prisma.members.findFirst({
                where: {
                    id: masteragentid,
                },
            });
            if (memberMAsterAgent) {
                masterAgentID = memberMAsterAgent.email;
            }
            return {
                ...user,
                masterAgentID
            };
        })
    )

    const processedUsersV2 = processedUsers.map(user => {
        const deposit = user.transaction.reduce((sum, transaction) => {
            if (transaction.type === "deposit") {
                return sum + transaction.amount;
            }
            return sum;
        }, 0);
        const withdrawals = user.transaction.reduce((sum, transaction) => {
            if (transaction.type === "withdrawal") {
                return sum + transaction.amount;
            }
            return sum;
        }, 0);
        return {
            ...user,
            deposit,
            withdrawals
        };
    })

    const processedUsersV3 = processedUsersV2.map(user => {
        const userBalance =
            user?.withdrawals === 0 && user?.deposit === 0 ? 0 : user?.balance || 0;
        const operator_gross_income =
            user.deposit - (user.withdrawals + (userBalance || 0));
        const master_agent_gross_income =
            (operator_gross_income * (user.agents?.masteragents?.royalty || 0)) / 100;
        const agent_gross_income =
            (operator_gross_income * (user.agents?.royalty || 0)) / 100;
        const operator_net_income =
            operator_gross_income - master_agent_gross_income;
        const master_agent_net_income =
            master_agent_gross_income - agent_gross_income;
        const agent_net_income = agent_gross_income;
        return {
            ...user,
            operator_gross_income,
            master_agent_gross_income,
            agent_gross_income,
            operator_net_income,
            master_agent_net_income,
            agent_net_income,
        };
    })

    function totality() {
        const totalOperatorGrossIncome = processedUsersV3.reduce(
            (sum, user) => sum + user.operator_gross_income,
            0
        );
        const totalOperatorNetIncome = processedUsersV3.reduce(
            (sum, user) => sum + user.operator_net_income,
            0
        );
        const totalAgentGrossIncome = processedUsersV3.reduce(
            (sum, user) => sum + user.agent_gross_income,
            0
        );
        const totalAgentNetIncome = processedUsersV3.reduce(
            (sum, user) => sum + user.agent_net_income,
            0
        );
        const totalMasterAgentGrossIncome = processedUsersV3.reduce(
            (sum, user) => sum + user.master_agent_gross_income,
            0
        );
        const totalMasterAgentNetIncome = processedUsersV3.reduce(
            (sum, user) => sum + user.master_agent_net_income,
            0
        );
        return {
            totalOperatorGrossIncome,
            totalOperatorNetIncome,
            totalAgentGrossIncome,
            totalAgentNetIncome,
            totalMasterAgentGrossIncome,
            totalMasterAgentNetIncome,
        };
    }

    const {
        totalOperatorGrossIncome,
        totalOperatorNetIncome,
        totalAgentGrossIncome,
        totalAgentNetIncome,
        totalMasterAgentGrossIncome,
        totalMasterAgentNetIncome,
    } = totality();
    return {
        totalOperatorGrossIncome,
        totalOperatorNetIncome,
        totalAgentGrossIncome,
        totalAgentNetIncome,
        totalMasterAgentGrossIncome,
        totalMasterAgentNetIncome,
        users: processedUsersV3,
    };
}