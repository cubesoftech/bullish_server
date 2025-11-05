import { Router } from "express";

// ---------- MIDDLEWARES ---------- //
import authenticate from "../middlewares/authenticate";


// ---------- CONTROLLERS ---------- //
// ---------- GET CONTROLLERS ---------- //
import getAnnouncement from "../controllers/admin/getAnnouncement";
import getDeposits from "../controllers/admin/getDeposits";
import getInquiries from "../controllers/admin/getInquiries";
import getMasterAgents from "../controllers/admin/getMasterAgents";
import getOngoingTrades from "../controllers/admin/getOngoingTrades";
import getTradeHistory from "../controllers/admin/getTradeHistory";
import getUser from "../controllers/admin/getUser";
import getWithdrawals from "../controllers/admin/getWithdrawals";
import getIncome from "../controllers/admin/getIncome";
import getSiteSettings from "../controllers/admin/getSiteSettings";
import getChanges from "../controllers/admin/getChanges";
import getTrades from "../controllers/admin/getTrades";


// ---------- POST CONTROLLERS ---------- //
import refreshToken from "../controllers/core/refreshToken";
import login from "../controllers/admin/login";
import updateMasterAgentStatus from "../controllers/admin/updateMasterAgentStatus";
import createAgent from "../controllers/admin/createAgent";
import updateWithdrawalStatus from "../controllers/admin/updateWithdrawalStatus";
import updateMemberTrade from "../controllers/admin/updateMemberTrade";
import updateTradeResult from "../controllers/admin/updateTradeResult";
import createAnnouncement from "../controllers/admin/createAnnouncement";
import createDeposit from "../controllers/admin/createDeposit";
import createMasterAgent from "../controllers/admin/createMasterAgent";
import deleteAnnouncement from "../controllers/admin/deleteAnnouncement";
import deleteTransactions from "../controllers/admin/deleteTransactions";
import deleteInquiry from "../controllers/admin/deleteInquiry";
import deleteMasterAgent from "../controllers/admin/deleteMasterAgent";
import updateAnnouncement from "../controllers/admin/updateAnnouncement";
import replyInquiry from "../controllers/admin/replyInquiry";
import updateTransaction from "../controllers/admin/updateTransaction";
import updateUserDetails from "../controllers/admin/updateUser";
import getInjectedSettings from "../controllers/admin/getInjectedSettings";
import getUserDetails from "../controllers/admin/getUserDetails";
import getUserTrades from "../controllers/admin/getUserTrades";
import getAgentWithdrawals from "../controllers/admin/getAgentWithdrawals";
import injectSettings from "../controllers/admin/injectSettings";
import updateTradeMaxbet from "../controllers/admin/updateTradeMaxbet";
import updateMasterAgent from "../controllers/admin/updateMasterAgent";
import switchTrade from "../controllers/admin/switchTrade";
import updateUserMaxbet from "../controllers/admin/updateUserMaxbet";
import updateSiteSettings from "../controllers/admin/updateSiteSettings";
import forceLogoutUser from "../controllers/admin/forceLogoutUser";
import updateUserSwitchBet from "../controllers/admin/updateUserSwitchBet";
import updateUserTrades from "../controllers/admin/updateUserTrades";
import deleteUsers from "../controllers/admin/deleteUsers";


// ---------- ROUTER ---------- //
const router = Router();
export default router;


// ---------- REQUEST INTERFACE ---------- //
interface Request {
    endpoint: string,
    middlewares: any[],
    controller: any
}


// ---------- GET REQUESTS ---------- //
// ---------- UNSECURED GET REQUESTS ---------- //
router.get('/', (req, res) => {
    res.send('User...');
});

// ---------- SECURED GET REQUESTS ---------- //
const getRequests: Request[] = [
    { endpoint: "getAnnouncement", middlewares: [authenticate], controller: getAnnouncement },
    { endpoint: "getDeposits", middlewares: [authenticate], controller: getDeposits },
    { endpoint: "getInquiries", middlewares: [authenticate], controller: getInquiries },
    { endpoint: "getMasterAgents", middlewares: [authenticate], controller: getMasterAgents },
    { endpoint: "getOngoingTrades", middlewares: [authenticate], controller: getOngoingTrades },
    { endpoint: "getTradeHistory", middlewares: [authenticate], controller: getTradeHistory },
    { endpoint: "getUser", middlewares: [authenticate], controller: getUser },
    { endpoint: "getWithdrawals", middlewares: [authenticate], controller: getWithdrawals },
    { endpoint: "getIncome", middlewares: [authenticate], controller: getIncome },
    { endpoint: "getSiteSettings", middlewares: [authenticate], controller: getSiteSettings },
    { endpoint: "getChanges", middlewares: [authenticate], controller: getChanges },
    { endpoint: "getTrades", middlewares: [authenticate], controller: getTrades },
]
for (const request of getRequests) {
    const { endpoint, middlewares, controller } = request;

    router.get(`/${endpoint}`, ...middlewares, controller)
}


// ---------- POST REQUESTS ---------- //
// ---------- UNSECURED POST REQUESTS ---------- //
router.post('/login', login);
router.post('/refreshToken', refreshToken);

// ---------- SECURED POST REQUESTS ---------- //
const postRequests: Request[] = [
    { endpoint: "updateMasterAgentStatus", middlewares: [authenticate], controller: updateMasterAgentStatus },
    { endpoint: "createAgent", middlewares: [authenticate], controller: createAgent },
    { endpoint: "updateWithdrawalStatus", middlewares: [authenticate], controller: updateWithdrawalStatus },
    { endpoint: "updateMemberTrade", middlewares: [authenticate], controller: updateMemberTrade },
    { endpoint: "updateTradeResult", middlewares: [authenticate], controller: updateTradeResult },
    { endpoint: "createAnnouncement", middlewares: [authenticate], controller: createAnnouncement },
    { endpoint: "createDeposit", middlewares: [authenticate], controller: createDeposit },
    { endpoint: "createMasterAgent", middlewares: [authenticate], controller: createMasterAgent },
    { endpoint: "deleteAnnouncement", middlewares: [authenticate], controller: deleteAnnouncement },
    { endpoint: "deleteTransactions", middlewares: [authenticate], controller: deleteTransactions },
    { endpoint: "deleteInquiry", middlewares: [authenticate], controller: deleteInquiry },
    { endpoint: "deleteMasterAgent", middlewares: [authenticate], controller: deleteMasterAgent },
    { endpoint: "updateAnnouncement", middlewares: [authenticate], controller: updateAnnouncement },
    { endpoint: "replyInquiry", middlewares: [authenticate], controller: replyInquiry },
    { endpoint: "updateTransaction", middlewares: [authenticate], controller: updateTransaction },
    { endpoint: "updateUserDetails", middlewares: [authenticate], controller: updateUserDetails },
    { endpoint: "getInjectedSettings", middlewares: [authenticate], controller: getInjectedSettings },
    { endpoint: "getUserDetails", middlewares: [authenticate], controller: getUserDetails },
    { endpoint: "getUserTrades", middlewares: [authenticate], controller: getUserTrades },
    { endpoint: "getAgentWithdrawals", middlewares: [authenticate], controller: getAgentWithdrawals },
    { endpoint: "injectSettings", middlewares: [authenticate], controller: injectSettings },
    { endpoint: "updateTradeMaxbet", middlewares: [authenticate], controller: updateTradeMaxbet },
    { endpoint: "updateMasterAgent", middlewares: [authenticate], controller: updateMasterAgent },
    { endpoint: "switchTrade", middlewares: [authenticate], controller: switchTrade },
    { endpoint: "updateUserMaxbet", middlewares: [authenticate], controller: updateUserMaxbet },
    { endpoint: "updateSiteSettings", middlewares: [authenticate], controller: updateSiteSettings },
    { endpoint: "forceLogoutUser", middlewares: [authenticate], controller: forceLogoutUser },
    { endpoint: "updateUserSwitchBet", middlewares: [authenticate], controller: updateUserSwitchBet },
    { endpoint: "updateUserTrades", middlewares: [authenticate], controller: updateUserTrades },
    { endpoint: "deleteUsers", middlewares: [authenticate], controller: deleteUsers },
]
for (const request of postRequests) {
    const { endpoint, middlewares, controller } = request;

    router.post(`/${endpoint}`, ...middlewares, controller)
}