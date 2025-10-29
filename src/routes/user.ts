import { Router } from "express";


// ---------- MIDDLEWARES ---------- //
import authenticate from "../middlewares/authenticate";


// ---------- CONTROLLERS ---------- //
// ---------- GET CONTROLLERS ---------- //
import getAnnouncement from "../controllers/user/getAnnouncement";
import getBalance from "../controllers/user/getBalance";
import getBanks from "../controllers/user/getBanks";
import getGameSettings from "../controllers/user/getGameSettings";
import getInquiries from "../controllers/user/getInquiries";
import getMemberDetails from "../controllers/user/getMemberDetails";
import getMyPageData from "../controllers/user/getMyPageData";
import getTradeData from "../controllers/user/getTradeData";
import getTradeHistory from "../controllers/user/getTradeHistory";
import getTransactions from "../controllers/user/getTransactions";
import getUserStats from "../controllers/user/getUserStats";


// ---------- POST CONTROLLERS ---------- //
import refreshToken from "../controllers/core/refreshToken";
import createTransaction from "../controllers/user/createTransaction";
import executeTrade from "../controllers/user/executeTrade";
import login from "../controllers/user/login";
import logout from "../controllers/user/logout";
import register from "../controllers/user/register";
import updateInfo from "../controllers/user/updateInfo";


// ---------- ROUTER ---------- //
const router = Router();
export default router;


// ---------- GET REQUESTS ---------- //
// ---------- UNSECURED GET REQUESTS ---------- //
router.get('/', (req, res) => {
    res.send('User...');
});
router.get('/getAnnouncement', getAnnouncement);
router.get('/getBanks', getBanks);
router.get('/getGameSettings', getGameSettings);

// ---------- SECURED GET REQUESTS ---------- //
router.get('/getBalance', authenticate, getBalance);
router.get('/getInquiries', authenticate, getInquiries);
router.get('/getMemberDetails', authenticate, getMemberDetails);
router.get('/getMyPageData', authenticate, getMyPageData);
router.get('/getTradeData', authenticate, getTradeData);
router.get('/getTradeHistory', authenticate, getTradeHistory);
router.get('/getTransactions', authenticate, getTransactions);
router.get('/getUserStats', authenticate, getUserStats);


// ---------- POST REQUESTS ---------- //
// ---------- UNSECURED POST REQUESTS ---------- //
router.post('/login', login);
router.post('/register', register);
router.post('/refreshToken', refreshToken);

// ---------- SECURED POST REQUESTS ---------- //
router.post('/createTransaction', authenticate, createTransaction);
router.post('/executeTrade', authenticate, executeTrade);
router.post('/logout', authenticate, logout);
router.post('/updateInfo', authenticate, updateInfo);