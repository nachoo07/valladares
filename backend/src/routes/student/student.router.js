import express from 'express';
import { body, param } from 'express-validator';
import {
    getAllStudents,
    createStudent,
    deleteStudent,
    updateStudent,
    getStudentById
} from '../../controllers/student/student.controller.js';
import { protect, admin } from '../../middlewares/login/protect.js'; // Importar los middlewares

const router = express.Router();

const validateStudent = [
    body('name').notEmpty().withMessage('Name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('cuil').matches(/^\d{11}$/).withMessage('Valid CUIL is required'),
    body('birthDate').isDate().withMessage('Valid birth date is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('mail').isEmail().withMessage('Valid email is required'),
    body('category').notEmpty().withMessage('Category is required')
  ];

// Rutas protegidas (requieren autenticación)
router.post('/create', validateStudent, protect, admin, createStudent);
router.put('/update/:id', [param('id').isMongoId()], validateStudent, protect, admin, updateStudent);
router.delete('/delete/:id', [param('id').isMongoId()], protect, admin, deleteStudent);

// Rutas públicas (sin autenticación)
router.get('/:id', [param('id').isMongoId()], protect, admin, getStudentById);
router.get('/', protect, getAllStudents);

export default router;