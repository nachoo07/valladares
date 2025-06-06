import express from 'express';
import { param, body, query } from 'express-validator';
import {
    getAllShares,
    createShare,
    deleteShare,
    updateShare,
    getShareById,
    getSharesByStudent,
    getSharesByDate,
    getSharesByDateRange,
    getStudentsWithShareStatus,
    updatePendingShares
} from '../../controllers/share/share.controller.js';
import { protect, admin } from '../../middlewares/login/protect.js'; // Importar los middlewares

const router = express.Router();


router.post('/create', [
    body('student').isMongoId().withMessage('Valid student ID is required'),
    body('date').isDate().withMessage('Valid date is required'),
    body('amount').isNumeric().withMessage('Valid amount is required')
  ], protect, admin, createShare);
  router.put('/update/:id', [param('id').isMongoId()], protect, admin, updateShare);
  router.delete('/delete/:id', [param('id').isMongoId()], protect, admin, deleteShare);
  router.get('/date/:date', [param('date').isDate()], protect, admin, getSharesByDate);
  router.get('/date-range', [
    query('start').isDate().withMessage('Valid start date is required'),
    query('end').isDate().withMessage('Valid end date is required')
  ], protect, admin, getSharesByDateRange);
  router.get('/students-status', protect, admin, getStudentsWithShareStatus);
  router.put('/update-pending', protect, admin, updatePendingShares);
  router.get('/:id', [param('id').isMongoId()], protect, admin, getShareById);
  router.get('/student/:studentId', [param('studentId').isMongoId()], protect, admin, getSharesByStudent);
  router.get('/', protect, admin, getAllShares);

export default router;