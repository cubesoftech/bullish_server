import { Router, Request, Response } from "express";

// ---------- MIDDLEWARES ---------- //
import authenticate from "../middlewares/authenticate";
import upload from "../middlewares/upload";

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
import getPopupImages from "../handlers/admin/getPopupImages";
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
import updateSeniorInvestorsAdditionalRates from "../handlers/admin/updateSeniorInvestorsAdditionalRates";
import uploadPopupImage from "../handlers/admin/uploadPopupImage";
import deletePopupImage from "../handlers/admin/deletePopupImage";


// ---------- ROUTER ---------- //
const router = Router();
export default router;


// ---------- GET REQUESTS ---------- //
const getRequests = [
    { endpoint: "getDashboardStats", middlewares: [authenticate], controller: getDashboardStats },
    { endpoint: "getUsers", middlewares: [authenticate], controller: getUsers },
    { endpoint: "getUserDetails", middlewares: [authenticate], controller: getUserDetails },
    { endpoint: "getPendingUsers", middlewares: [authenticate], controller: getPendingUsers },
    { endpoint: "getDepositRequests", middlewares: [authenticate], controller: getDepositRequests },
    { endpoint: "getWithdrawalRequests", middlewares: [authenticate], controller: getWithdrawalRequests },
    { endpoint: "getSeriesLog", middlewares: [authenticate], controller: getSeriesLog },
    { endpoint: "getNotice", middlewares: [authenticate], controller: getNotice },
    { endpoint: "getSeriesPeakSeason", middlewares: [authenticate], controller: getSeriesPeakSeason },
    { endpoint: "getInvestmentLog", middlewares: [authenticate], controller: getInvestmentLog },
    { endpoint: "getProfitLog", middlewares: [authenticate], controller: getProfitLog },
    { endpoint: "getActivityLog", middlewares: [authenticate], controller: getActivityLog },
    { endpoint: "getReferrers", middlewares: [authenticate], controller: getReferrers },
    { endpoint: "getInquiry", middlewares: [authenticate], controller: getInquiry },
    { endpoint: "getDirectInquiryLog", middlewares: [authenticate], controller: getDirectInquiryLog },
    { endpoint: "getDirectInquiryMessages", middlewares: [authenticate], controller: getDirectInquiryMessages },
    { endpoint: "getSuggestedUsers", middlewares: [authenticate], controller: getSuggestedUsers },
    { endpoint: "getReviewLog", middlewares: [authenticate], controller: getReviewLog },
    { endpoint: "getReferrerPointConversionLog", middlewares: [authenticate], controller: getReferrerPointConversionLog },
    { endpoint: "getAgents", middlewares: [authenticate], controller: getAgents },
    { endpoint: "getReferralProfitLog", middlewares: [authenticate], controller: getReferralProfitLog },
    { endpoint: "getMonthlyDeposits", middlewares: [authenticate], controller: getMonthlyDeposit },
    { endpoint: "getMonthlyWithdrawals", middlewares: [authenticate], controller: getMonthlyWithdrawals },
    { endpoint: "getMonthlySettlementProfit", middlewares: [authenticate], controller: getMonthlySettlementProfit },
    { endpoint: "getNotificationCount", middlewares: [authenticate], controller: getNotificationCount },
    { endpoint: "checkDirectionInquiry", middlewares: [authenticate], controller: checkDirectionInquiry },
    { endpoint: "getDeletedUsers", middlewares: [authenticate], controller: getDeletedUsers },
    { endpoint: "getUserDeletionRequests", middlewares: [authenticate], controller: getUserDeletionRequests },
    { endpoint: "getWithdrawExtraBalanceRequestLog", middlewares: [authenticate], controller: getWithdrawExtraBalanceRequestLog },
    { endpoint: "getWithdrawInvestmentAmountLog", middlewares: [authenticate], controller: getWithdrawInvestmentAmountLog },
    { endpoint: "getExtendInvestmentDurationLog", middlewares: [authenticate], controller: getExtendInvestmentDurationLog },
    { endpoint: "getInvestmentEarlyWithdrawalLog", middlewares: [authenticate], controller: getInvestmentEarlyWithdrawalLog },
    { endpoint: "getReservationLog", middlewares: [authenticate], controller: getReservationLog },
    { endpoint: "getChangeUserInfoLog", middlewares: [authenticate], controller: getChangeUserInfoLog },
    { endpoint: "getPopupImages", middlewares: [authenticate], controller: getPopupImages },
]
router.get('/', (req, res) => {
    res.send('Admin...');
});
{
    getRequests.map(request => {
        const { endpoint, controller, middlewares } = request;

        return router.get(`/${endpoint}`, ...middlewares, controller);
    })
}
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
const postRequests = [
    { endpoint: "refresh", middlewares: [], controller: refresh },
    { endpoint: "login", middlewares: [], controller: login },
    { endpoint: "deleteUsers", middlewares: [authenticate], controller: deleteUsers },
    { endpoint: "approveUserRequest", middlewares: [authenticate], controller: approveUserRequest },
    { endpoint: "deleteUserRequest", middlewares: [authenticate], controller: deleteUserRequest },
    { endpoint: "updateDepositRequestStatus", middlewares: [authenticate], controller: updateDepositRequestStatus },
    { endpoint: "updateWithdrawalRequestStatus", middlewares: [authenticate], controller: updateWithdrawalRequestStatus },
    { endpoint: "createNotice", middlewares: [authenticate], controller: createNotice },
    { endpoint: "updateNotice", middlewares: [authenticate], controller: updateNotice },
    { endpoint: "deleteNotice", middlewares: [authenticate], controller: deleteNotice },
    { endpoint: "deleteActivityLog", middlewares: [authenticate], controller: deleteActivityLog },
    { endpoint: "createInquiry", middlewares: [authenticate], controller: createInquiry },
    { endpoint: "replyInquiry", middlewares: [authenticate], controller: replyInquiry },
    { endpoint: "deleteInquiry", middlewares: [authenticate], controller: deleteInquiry },
    { endpoint: "updateSeriesStatus", middlewares: [authenticate], controller: updateSeriesStatus },
    { endpoint: "replyDirectInquiry", middlewares: [authenticate], controller: replyDirectInquiry },
    { endpoint: "updateSeriesPeakSeason", middlewares: [authenticate], controller: updateSeriesPeakSeason },
    { endpoint: "updateReviewStatus", middlewares: [authenticate], controller: updateReviewStatus },
    { endpoint: "updateReferrerPointConversion", middlewares: [authenticate], controller: updateReferrerPointConversion },
    { endpoint: "updateAdminNote", middlewares: [authenticate], controller: updateAdminNote },
    { endpoint: "updateAdminSummary", middlewares: [authenticate], controller: updateAdminSummary },
    { endpoint: "createAgent", middlewares: [authenticate], controller: createAgent },
    { endpoint: "updateAgent", middlewares: [authenticate], controller: updateAgent },
    { endpoint: "deleteAgent", middlewares: [authenticate], controller: deleteAgent },
    { endpoint: "updateUserPayoutSchedule", middlewares: [authenticate], controller: updateUserPayoutSchedule },
    { endpoint: "updatePendingInvestment", middlewares: [authenticate], controller: updatePendingInvestment },
    { endpoint: "updateSeriesSettlementRates", middlewares: [authenticate], controller: updateSeriesSettlementRates },
    { endpoint: "recalculateInvestmentProfit", middlewares: [authenticate], controller: recalculateInvestmentProfit },
    { endpoint: "createDirectInquiry", middlewares: [authenticate], controller: createDirectInquiry },
    { endpoint: "reactivateUserAccountDeletion", middlewares: [authenticate], controller: reactivateUserAccountDeletion },
    { endpoint: "updateUserDeletionRequestStatus", middlewares: [authenticate], controller: updateUserDeletionRequestStatus },
    { endpoint: "updateWithdrawExtraBalanceRequestStatus", middlewares: [authenticate], controller: updateWithdrawExtraBalanceRequestStatus },
    { endpoint: "updateWithdrawInvestedAmountStatus", middlewares: [authenticate], controller: updateWithdrawInvestedAmountStatus },
    { endpoint: "updateUserExtraWithdrawableBalance", middlewares: [authenticate], controller: updateUserExtraWithdrawableBalance },
    { endpoint: "updateInvestmentCreatedAt", middlewares: [authenticate], controller: updateInvestmentCreatedAt },
    { endpoint: "updateProfitCreatedAt", middlewares: [authenticate], controller: updateProfitCreatedAt },
    { endpoint: "updateExtendInvestmentDurationStatus", middlewares: [authenticate], controller: updateExtendInvestmentDurationStatus },
    { endpoint: "updateInvestmentEarlyWithdrawalRequest", middlewares: [authenticate], controller: updateInvestmentEarlyWithdrawalRequest },
    { endpoint: "updateInvestmentLogStatus", middlewares: [authenticate], controller: updateInvestmentLogStatus },
    { endpoint: "replyToReservation", middlewares: [authenticate], controller: replyToReservation },
    { endpoint: "deleteReservationLog", middlewares: [authenticate], controller: deleteReservationLog },
    { endpoint: "deleteProfit", middlewares: [authenticate], controller: deleteProfit },
    { endpoint: "updateChangeUserInfoStatus", middlewares: [authenticate], controller: updateChangeUserInfoStatus },
    { endpoint: "updateNoticeCreatedAt", middlewares: [authenticate], controller: updateNoticeCreatedAt },
    { endpoint: "getAgentDetails", middlewares: [authenticate], controller: getAgentDetails },
    { endpoint: "updateAgentIncentiveStatus", middlewares: [authenticate], controller: updateAgentIncentiveStatus },
    { endpoint: "updateSeniorInvestorsAdditionalRates", middlewares: [authenticate], controller: updateSeniorInvestorsAdditionalRates },
    { endpoint: "uploadPopupImage", middlewares: [authenticate, upload.single("image")], controller: uploadPopupImage },
    { endpoint: "deletePopupImage", middlewares: [authenticate], controller: deletePopupImage },
]
{
    postRequests.map(request => {
        const { endpoint, middlewares, controller } = request

        return router.post(`/${endpoint}`, ...middlewares, controller);
    })
}