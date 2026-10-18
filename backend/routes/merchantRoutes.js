import express from 'express';
import {
  checkMerchant,
  saveMerchantMapping,
  getMerchants,
  updateMerchantMapping,
  deleteMerchantMapping,
} from '../controllers/merchantController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/check', checkMerchant);
router.route('/').get(getMerchants).post(saveMerchantMapping);
router.route('/:id').put(updateMerchantMapping).delete(deleteMerchantMapping);

export default router;
