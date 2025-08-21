import { Router } from "express";

// ---------- MIDDLEWARES ---------- //
import authenticate from "../middlewares/authenticate";


// ---------- HANDLERS ---------- //
// ---------- GET HANDLERS ---------- //
import userInfo from "../handlers/user/userInfo";
import logout from "../handlers/user/logout";
import getReviews from "../handlers/user/getReviews";
import getSeriesData from "../handlers/user/getSeriesData";
import getInquiries from "../handlers/user/getInquiries";
import getTopInvestor from "../handlers/user/getTopInvestor";
import getDirectInquiryMessages from "../handlers/user/getDirectInquiryMessages";
import getNotices from "../handlers/user/getNotices";
import getDashboardStats from "../handlers/user/getDashboardStats";
import getSeriesLog from "../handlers/user/getSeriesLog";
import getOngoingInvestment from "../handlers/user/getOngoingInvestment";
import getEndingInvestments from "../handlers/user/getEndingInvestments";
import getProfitLog from "../handlers/user/getProfitLog";
import getUserInvestmentSummary from "../handlers/user/getUserInvestmentSummary";
import getLatestMonthlyProfit from "../handlers/user/getLatestMonthlyProfit";


// ---------- POST HANDLERS ---------- //
import register from "../handlers/user/register";
import login from "../handlers/user/login";
import deposit from "../handlers/user/deposit";
import withdrawal from "../handlers/user/withdrawal";
import updateUserInfo from "../handlers/user/updateUserInfo";
import applyConsultation from "../handlers/user/applyConsultation";
import createInquiry from "../handlers/user/createInqury";
import createReview from "../handlers/user/createReview";
import investToSeries from "../handlers/user/investToSeries";
import replyDirectInquiry from "../handlers/user/replyDirectInquiry";
import sendOTP from "../handlers/user/sendOTP";
import loginUsingOTP from "../handlers/user/loginUsingOTP";
import deleteAccount from "../handlers/user/deleteAccount";

// ---------- ROUTER ---------- //
const router = Router();
export default router;


// ---------- GET REQUESTS ---------- //
// ---------- UNSECURED GET REQUESTS ---------- //
router.get('/', (req, res) => {
    res.send('User...');
});
router.get('/getReviews', getReviews);
router.get('/getSeriesData', getSeriesData);
// TODO: fix this api and make it available on frontend
router.get('/getTopInvestor', getTopInvestor);
router.get('/getNotices', getNotices);
// ---------- SECURED GET REQUESTS ---------- //
router.get('/logout', authenticate, logout);
router.get('/userInfo', authenticate, userInfo)
router.get('/getInquiries', authenticate, getInquiries);
router.get('/getDirectInquiryMessages', authenticate, getDirectInquiryMessages);
router.get('/getDashboardStats', authenticate, getDashboardStats);
router.get('/getSeriesLog', authenticate, getSeriesLog);
router.get('/getOngoingInvestment', authenticate, getOngoingInvestment);
router.get('/getEndingInvestments', authenticate, getEndingInvestments);
router.get('/getProfitLog', authenticate, getProfitLog);
router.get('/getUserInvestmentSummary', authenticate, getUserInvestmentSummary);
router.get('/getLatestMonthlyProfit', authenticate, getLatestMonthlyProfit);


// ---------- POST REQUESTS ---------- //
// ---------- UNSECURED POST REQUESTS ---------- //
router.post('/register', register)
router.post('/login', login)
router.post('/sendOTP', sendOTP)
router.post('/loginUsingOTP', loginUsingOTP)
// ---------- SECURED POST REQUESTS ---------- //
router.post('/deposit', authenticate, deposit)
router.post('/withdrawal', authenticate, withdrawal)
router.post('/updateUserInfo', authenticate, updateUserInfo)
router.post('/applyConsultation', authenticate, applyConsultation)
router.post('/createInquiry', authenticate, createInquiry)
router.post('/createReview', authenticate, createReview)
router.post('/investToSeries', authenticate, investToSeries)
router.post('/replyDirectInquiry', authenticate, replyDirectInquiry)
router.post('/deleteAccount', authenticate, deleteAccount)