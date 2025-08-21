import { Router } from "express";

// ---------- MIDDLEWARES ---------- //
import authenticate from "../middlewares/authenticate";


// ---------- HANDLERS ---------- //
// ---------- GET HANDLERS ---------- //
import getUsers from "../handlers/admin/getUsers";
import getPendingUsers from "../handlers/admin/getPendingUsers";
import getDepositRequests from "../handlers/admin/getDepositRequests";
import getWithdrawalRequests from "../handlers/admin/getWithdrawalRequests";
import getNotice from "../handlers/admin/getNotice";
import getActivityLog from "../handlers/admin/getActivityLog";
import getInquiry from "../handlers/admin/getInquiry";
import getSeriesLog from "../handlers/admin/getSeriesLog";
import getDashboardStats from "../handlers/admin/getDashboardStats";
import getSuggestedUsers from "../handlers/admin/searchUser";
import getDirectInquiryLog from "../handlers/admin/getDirectInquiryLog";
import getDirectInquiryMessages from "../handlers/admin/getDirectInquiryMessage";
import getSeriesPeakSeason from "../handlers/admin/getSeriesPeakSeason";
import getInvestmentLog from "../handlers/admin/getInvestmentLog";
import getProfitLog from "../handlers/admin/getProfitLog";
import generateSeriesData from "../handlers/admin/generateSeriesData";
import createDummyUsers from "../handlers/admin/createDummyUsers";


// ---------- POST HANDLERS ---------- //
import login from "../handlers/admin/login";
import deleteUsers from "../handlers/admin/deleteUsers";
import getUserDetails from "../handlers/admin/getUserDetails";
import approveUserRequest from "../handlers/admin/approveUserRequest";
import deleteUserRequest from "../handlers/admin/deleteUserRequest";
import updateDepositRequestStatus from "../handlers/admin/updateDepositRequestStatus";
import updateWithdrawalRequestStatus from "../handlers/admin/updateWithdrawalRequestStatus";
import createNotice from "../handlers/admin/createNotice";
import updateNotice from "../handlers/admin/updateNotice";
import deleteNotice from "../handlers/admin/deleteNotices";
import deleteActivityLog from "../handlers/admin/deleteActivityLog";
import createInquiry from "../handlers/admin/createInquiry";
import replyInquiry from "../handlers/admin/replyInquiry";
import deleteInquiry from "../handlers/admin/deleteInquiry";
import getReferrers from "../handlers/admin/getReferrers";
import updateSeriesStatus from "../handlers/admin/updateSeriesStatus";
import replyDirectInquiry from "../handlers/admin/replyDirectInquiry";
import updateSeriesPeakSeason from "../handlers/admin/updateSeriesPeakSeason";


// ---------- ROUTER ---------- //
const router = Router();
export default router;


// ---------- GET REQUESTS ---------- //
router.get('/', (req, res) => {
    res.send('Admin...');
});
router.get("/getDashboardStats", authenticate, getDashboardStats);
router.get("/getUsers", authenticate, getUsers);
router.get("/getUserDetails", authenticate, getUserDetails);
router.get("/getPendingUsers", authenticate, getPendingUsers);
router.get("/getDepositRequests", authenticate, getDepositRequests);
router.get("/getWithdrawalRequests", authenticate, getWithdrawalRequests);
router.get("/getSeriesLog", authenticate, getSeriesLog);
router.get("/getNotice", authenticate, getNotice);
router.get("/getSeriesPeakSeason", authenticate, getSeriesPeakSeason);
router.get("/getInvestmentLog", authenticate, getInvestmentLog);
router.get("/getProfitLog", authenticate, getProfitLog);
router.get("/getActivityLog", authenticate, getActivityLog);
router.get("/getReferrers", authenticate, getReferrers);
router.get("/getInquiry", authenticate, getInquiry);
router.get("/getDirectInquiryLog", authenticate, getDirectInquiryLog);
router.get("/getDirectInquiryMessages", authenticate, getDirectInquiryMessages);
router.get("/getSuggestedUsers", authenticate, getSuggestedUsers);


// commented out for now, as it is not used in the current context
// use only to generate series data
// ---------- NOTE ---------- //
// ---------- DONT USE THIS API ENDPOINT TO ADD NEW SERIES ---------- //
// ---------- IF YOU WANT TO ADD NEW SERIES, PLEASE USE THE ADMIN PANEL ---------- //
// router.get('/generateSeriesData', authenticate, generateSeriesData)

// commented out for now, as it is not used in the current context
// use only to generate dummy users
// router.get('/createDummyUsers', authenticate, createDummyUsers);


// ---------- POST REQUESTS ---------- //
router.post('/login', login);
router.post('/deleteUsers', authenticate, deleteUsers);
router.post('/approveUserRequest', authenticate, approveUserRequest);
router.post('/deleteUserRequest', authenticate, deleteUserRequest);
router.post('/updateDepositRequestStatus', authenticate, updateDepositRequestStatus);
router.post('/updateWithdrawalRequestStatus', authenticate, updateWithdrawalRequestStatus);
router.post('/createNotice', authenticate, createNotice);
router.post('/updateNotice', authenticate, updateNotice);
router.post('/deleteNotice', authenticate, deleteNotice);
router.post('/deleteActivityLog', authenticate, deleteActivityLog);
router.post('/createInquiry', authenticate, createInquiry);
router.post('/replyInquiry', authenticate, replyInquiry);
router.post('/deleteInquiry', authenticate, deleteInquiry);
router.post('/updateSeriesStatus', authenticate, updateSeriesStatus);
router.post('/replyDirectInquiry', authenticate, replyDirectInquiry);
router.post('/updateSeriesPeakSeason', authenticate, updateSeriesPeakSeason);