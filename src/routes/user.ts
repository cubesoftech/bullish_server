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

// ---------- ROUTER ---------- //
const router = Router();
export default router;


// ---------- GET REQUESTS ---------- //
router.get('/', (req, res) => {
    res.send('User...');
});
router.get('/userInfo', authenticate, userInfo)
router.get('/logout', authenticate, logout);
router.get('/getReviews', getReviews);
router.get('/getSeriesData', getSeriesData);
router.get('/getInquiries', authenticate, getInquiries);
router.get('/getTopInvestor', getTopInvestor);


// ---------- POST REQUESTS ---------- //
router.post('/register', register)
router.post('/login', login)
router.post('/deposit', authenticate, deposit)
router.post('/withdrawal', authenticate, withdrawal)
router.post('/updateUserInfo', authenticate, updateUserInfo)
router.post('/applyConsultation', authenticate, applyConsultation)
router.post('/createInquiry', authenticate, createInquiry)
router.post('/createReview', authenticate, createReview)
router.post('/investToSeries', authenticate, investToSeries)