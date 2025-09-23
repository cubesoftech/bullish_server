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
import getReviewLog from "../handlers/admin/getReviewLog";
import getReferrerPointConversionLog from "../handlers/admin/getReferrerPointConversionLog";
import getAgents from "../handlers/admin/getAgents";
import getReferralProfitLog from "../handlers/admin/getReferralProfitLog";
import getMonthlyDeposit from "../handlers/admin/getMonthlyDeposit";
import getMonthlyWithdrawals from "../handlers/admin/getMonthlyWithdrawal";
import getMonthlySettlementProfit from "../handlers/admin/getMonthlySettlementProfit";
import getNotificationCount from "../handlers/admin/getNotificationCount";
import getReferrers from "../handlers/admin/getReferrers";
import checkDirectionInquiry from "../handlers/admin/checkDirectInquiry";
import getDeletedUsers from "../handlers/admin/getDeletedUsers";
import getUserDeletionRequests from "../handlers/admin/getUserDeletionRequests";
import getWithdrawExtraBalanceRequestLog from "../handlers/admin/getWithdrawExtraBalanceRequestLog";
import getWithdrawInvestmentAmountLog from "../handlers/admin/getWithdrawInvestmentAmountLog";
import getExtendInvestmentDurationLog from "../handlers/admin/getExtendInvestmentDurationLog";
import getInvestmentEarlyWithdrawalLog from "../handlers/admin/getInvestmentEarlyWithdrawalLog";
import getReservationLog from "../handlers/admin/getReservationLog";
import getChangeUserInfoLog from "../handlers/admin/getChangeUserInfoLog";
import getUserDetails from "../handlers/admin/getUserDetails";
import generateSeriesData from "../handlers/admin/generateSeriesData";
import createDummyUsers from "../handlers/admin/createDummyUsers";


// ---------- POST HANDLERS ---------- //
import refresh from "../handlers/core/refresh";
import login from "../handlers/admin/login";
import deleteUsers from "../handlers/admin/deleteUsers";
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
import updateSeriesStatus from "../handlers/admin/updateSeriesStatus";
import replyDirectInquiry from "../handlers/admin/replyDirectInquiry";
import updateSeriesPeakSeason from "../handlers/admin/updateSeriesPeakSeason";
import updateReviewStatus from "../handlers/admin/updateReviewStatus";
import updateReferrerPointConversion from "../handlers/admin/updateReferrerPointConversion";
import updateAdminNote from "../handlers/admin/updateAdminNote";
import updateAdminSummary from "../handlers/admin/updateAdminSummary";
import createAgent from "../handlers/admin/createAgent";
import updateAgent from "../handlers/admin/updateAgent";
import deleteAgent from "../handlers/admin/deleteAgent";
import updateUserPayoutSchedule from "../handlers/admin/updateUserPayoutScedule";
import updatePendingInvestment from "../handlers/admin/updatePendingInvestment";
import updateSeriesSettlementRates from "../handlers/admin/updateSeriesSettlementRates";
import recalculateInvestmentProfit from "../handlers/admin/recalculateInvestmentProfit";
import createDirectInquiry from "../handlers/admin/createDirectInquiry";
import updateUserExtraWithdrawableBalance from "../handlers/admin/updateUserExtraWithdrawableBalance";
import reactivateUserAccountDeletion from "../handlers/admin/reactivateUserAccountDeletion";
import updateUserDeletionRequestStatus from "../handlers/admin/updateUserDeletionRequestStatus";
import updateWithdrawExtraBalanceRequestStatus from "../handlers/admin/updateWithdrawExtraBalanceRequestStatus";
import updateWithdrawInvestedAmountStatus from "../handlers/admin/updateWithdrawInvestedAmountStatus";
import updateInvestmentCreatedAt from "../handlers/user/updateInvestmentCreatedAt";
import updateProfitCreatedAt from "../handlers/user/updateProfitCreatedAt";
import updateExtendInvestmentDurationStatus from "../handlers/admin/updateExtendInvestmentDurationStatus";
import updateInvestmentEarlyWithdrawalRequest from "../handlers/admin/updateInvestmentEarlyWithdrawalRequest";
import updateInvestmentLogStatus from "../handlers/admin/updateInvestmentLogStatus";
import replyToReservation from "../handlers/admin/replyToReservation";
import deleteReservationLog from "../handlers/admin/deleteReservationLog";
import deleteProfit from "../handlers/admin/deleteProfit";
import updateChangeUserInfoStatus from "../handlers/admin/updateChangeUserInfoStatus";
import updateNoticeCreatedAt from "../handlers/admin/updateNoticeCreatedAt";
import getAgentDetails from "../handlers/admin/getAgentDetails";
import updateAgentIncentiveStatus from "../handlers/admin/updateAgentIncentiveStatus";


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
router.get("/getReviewLog", authenticate, getReviewLog);
router.get("/getReferrerPointConversionLog", authenticate, getReferrerPointConversionLog);
router.get("/getAgents", authenticate, getAgents);
router.get("/getReferralProfitLog", authenticate, getReferralProfitLog);
router.get("/getMonthlyDeposits", authenticate, getMonthlyDeposit);
router.get("/getMonthlyWithdrawals", authenticate, getMonthlyWithdrawals);
router.get("/getMonthlySettlementProfit", authenticate, getMonthlySettlementProfit);
router.get("/getNotificationCount", authenticate, getNotificationCount);
router.get("/checkDirectionInquiry", authenticate, checkDirectionInquiry);
router.get("/getDeletedUsers", authenticate, getDeletedUsers);
router.get("/getUserDeletionRequests", authenticate, getUserDeletionRequests);
router.get("/getWithdrawExtraBalanceRequestLog", authenticate, getWithdrawExtraBalanceRequestLog);
router.get("/getWithdrawInvestmentAmountLog", authenticate, getWithdrawInvestmentAmountLog);
router.get("/getExtendInvestmentDurationLog", authenticate, getExtendInvestmentDurationLog);
router.get("/getInvestmentEarlyWithdrawalLog", authenticate, getInvestmentEarlyWithdrawalLog);
router.get("/getReservationLog", authenticate, getReservationLog);
router.get("/getChangeUserInfoLog", authenticate, getChangeUserInfoLog);


// commented out for now, as it is not used in the current context
// use only to generate series data
// ---------- NOTE ---------- //
// ---------- DONT USE THIS API ENDPOINT TO ADD NEW SERIES ---------- //
// ---------- IF YOU WANT TO ADD NEW SERIES, PLEASE USE THE ADMIN PANEL ---------- //
// router.get('/generateSeriesData', authenticate, generateSeriesData)

// commented out for now, as it is not used in the current context
// use only to generate dummy users
// router.get('/createDummyUsers', createDummyUsers);


// ---------- POST REQUESTS ---------- //
router.post('/refresh', refresh);
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
router.post('/updateReviewStatus', authenticate, updateReviewStatus);
router.post('/updateReferrerPointConversion', authenticate, updateReferrerPointConversion);
router.post('/updateAdminNote', authenticate, updateAdminNote);
router.post('/updateAdminSummary', authenticate, updateAdminSummary);
router.post('/createAgent', authenticate, createAgent);
router.post('/updateAgent', authenticate, updateAgent);
router.post('/deleteAgent', authenticate, deleteAgent);
router.post('/updateUserPayoutSchedule', authenticate, updateUserPayoutSchedule);
router.post('/updatePendingInvestment', authenticate, updatePendingInvestment);
router.post('/updateSeriesSettlementRates', authenticate, updateSeriesSettlementRates);
router.post('/recalculateInvestmentProfit', authenticate, recalculateInvestmentProfit);
router.post('/createDirectInquiry', authenticate, createDirectInquiry);
router.post('/reactivateUserAccountDeletion', authenticate, reactivateUserAccountDeletion);
router.post('/updateUserDeletionRequestStatus', authenticate, updateUserDeletionRequestStatus);
router.post('/updateWithdrawExtraBalanceRequestStatus', authenticate, updateWithdrawExtraBalanceRequestStatus);
router.post('/updateWithdrawInvestedAmountStatus', authenticate, updateWithdrawInvestedAmountStatus);
router.post('/updateUserExtraWithdrawableBalance', authenticate, updateUserExtraWithdrawableBalance);
router.post('/updateInvestmentCreatedAt', authenticate, updateInvestmentCreatedAt);
router.post('/updateProfitCreatedAt', authenticate, updateProfitCreatedAt);
router.post('/updateExtendInvestmentDurationStatus', authenticate, updateExtendInvestmentDurationStatus);
router.post('/updateInvestmentEarlyWithdrawalRequest', authenticate, updateInvestmentEarlyWithdrawalRequest);
router.post('/updateInvestmentLogStatus', authenticate, updateInvestmentLogStatus);
router.post('/replyToReservation', authenticate, replyToReservation);
router.post('/deleteReservationLog', authenticate, deleteReservationLog);
router.post('/deleteProfit', authenticate, deleteProfit);
router.post('/updateChangeUserInfoStatus', authenticate, updateChangeUserInfoStatus);
router.post('/updateNoticeCreatedAt', authenticate, updateNoticeCreatedAt);
router.post('/getAgentDetails', authenticate, getAgentDetails);
router.post('/updateAgentIncentiveStatus', authenticate, updateAgentIncentiveStatus);