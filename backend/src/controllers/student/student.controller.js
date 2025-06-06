import Student from '../../models/student/student.model.js';
import Share from '../../models/share/share.model.js';
import Attendance from '../../models/attendance/attendance.model.js';
import mongoose from 'mongoose';
import multer from 'multer';
import cloudinary from 'cloudinary';
import sanitize from 'mongo-sanitize';
import pino from 'pino';

const logger = pino();

const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

export const getAllStudents = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const students = await Student.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    res.status(200).json(students.length ? students : { message: "No hay estudiantes disponibles" });
  } catch (error) {
    logger.error({ error: error.message }, 'Error al obtener estudiantes');
    res.status(500).json({ message: 'Error al obtener estudiantes' });
  }
};

export const createStudent = async (req, res) => {
  upload.single('profileImage')(req, res, async (err) => {
    if (err) {
      logger.error({ error: err.message }, 'Error al subir imagen');
      return res.status(500).json({ message: 'Error al subir la imagen' });
    }

    const {
      name,
      lastName,
      dni,
      birthDate,
      address,
      guardianName,
      guardianPhone,
      category,
      mail,
      state,
      hasSiblingDiscount,
      club,
      isAsthmatic,
      hasHeadaches,
      hasSeizures,
      hasDizziness,
      hasEpilepsy,
      hasDiabetes,
      isAllergic,
      allergyDetails,
      takesMedication,
      medicationDetails,
      otherDiseases,
      bloodType,
    } = sanitize(req.body);

    if (!name || !dni || !birthDate || !address || !category || !club) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    if (!['Valladares', 'El Palmar'].includes(club)) {
      return res.status(400).json({ message: "El club debe ser 'Valladares' o 'El Palmar'" });
    }

    try {
      let profileImage = 'https://i.pinimg.com/736x/24/f2/25/24f22516ec47facdc2dc114f8c3de7db.jpg';
      if (req.file) {
        const result = await cloudinaryV2.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          { folder: 'students' }
        );
        profileImage = result.secure_url;
      }

      const studentData = {
        name,
        lastName,
        dni,
        birthDate: new Date(birthDate),
        address,
        guardianName,
        guardianPhone,
        category,
        mail,
        state,
        profileImage,
        hasSiblingDiscount: hasSiblingDiscount !== undefined ? hasSiblingDiscount : false,
        club,
      };

      // Agregar campos médicos solo si están presentes en la solicitud
      if (isAsthmatic !== undefined) studentData.isAsthmatic = isAsthmatic;
      if (hasHeadaches !== undefined) studentData.hasHeadaches = hasHeadaches;
      if (hasSeizures !== undefined) studentData.hasSeizures = hasSeizures;
      if (hasDizziness !== undefined) studentData.hasDizziness = hasDizziness;
      if (hasEpilepsy !== undefined) studentData.hasEpilepsy = hasEpilepsy;
      if (hasDiabetes !== undefined) studentData.hasDiabetes = hasDiabetes;
      if (isAllergic !== undefined) {
        studentData.isAllergic = isAllergic;
        if (isAllergic && allergyDetails) studentData.allergyDetails = allergyDetails;
      }
      if (takesMedication !== undefined) {
        studentData.takesMedication = takesMedication;
        if (takesMedication && medicationDetails) studentData.medicationDetails = medicationDetails;
      }
      if (otherDiseases !== undefined) studentData.otherDiseases = otherDiseases;
      if (bloodType !== undefined) studentData.bloodType = bloodType;

      const newStudent = await Student.create(studentData);

      logger.info({ studentId: newStudent._id }, 'Estudiante creado');
      res.status(201).json({ message: "Estudiante creado exitosamente", student: newStudent });
    } catch (error) {
      logger.error({ error: error.message }, 'Error al crear estudiante');
      res.status(500).json({ message: 'Error al crear estudiante', error: error.message });
    }
  });
};

export const deleteStudent = async (req, res) => {
  const { id } = sanitize(req.params);

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    if (student.profileImage && student.profileImage !== 'https://i.pinimg.com/736x/24/f2/25/24f22516ec47facdc2dc114f8c3de7db.jpg') {
      const publicId = student.profileImage.split('/').pop().split('.')[0];
      await cloudinaryV2.uploader.destroy(`students/${publicId}`);
    }

    await Share.deleteMany({ student: id });
    await Attendance.updateMany(
      { 'attendance.idStudent': id },
      { $pull: { attendance: { idStudent: id } } }
    );
    await Attendance.deleteMany({ attendance: { $size: 0 } });
    await Student.findByIdAndDelete(id);

    logger.info({ studentId: id }, 'Estudiante eliminado');
    res.status(200).json({ message: 'Estudiante eliminado exitosamente' });
  } catch (error) {
    logger.error({ error: error.message }, 'Error al eliminar estudiante');
    res.status(500).json({ message: 'Error al eliminar estudiante', error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  upload.single('profileImage')(req, res, async (err) => {
    if (err) {
      logger.error({ error: err.message }, 'Error al subir imagen');
      return res.status(500).json({ message: 'Error al subir la imagen' });
    }

    const { id } = sanitize(req.params);
    const {
      name,
      lastName,
      dni,
      birthDate,
      address,
      guardianName,
      guardianPhone,
      category,
      mail,
      state,
      hasSiblingDiscount,
      club,
      isAsthmatic,
      hasHeadaches,
      hasSeizures,
      hasDizziness,
      hasEpilepsy,
      hasDiabetes,
      isAllergic,
      allergyDetails,
      takesMedication,
      medicationDetails,
      otherDiseases,
      bloodType,
    } = sanitize(req.body);

    if (!name || !dni || !birthDate || !address || !category || !club) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    if (!['Valladares', 'El Palmar'].includes(club)) {
      return res.status(400).json({ message: "El club debe ser 'Valladares' o 'El Palmar'" });
    }

    try {
      let profileImage = req.body.profileImage;
      if (req.file) {
        const result = await cloudinaryV2.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          { folder: 'students' }
        );
        profileImage = result.secure_url;

        const oldStudent = await Student.findById(id);
        if (oldStudent.profileImage && oldStudent.profileImage !== 'https://i.pinimg.com/736x/24/f2/25/24f22516ec47facdc2dc114f8c3de7db.jpg') {
          const publicId = oldStudent.profileImage.split('/').pop().split('.')[0];
          await cloudinaryV2.uploader.destroy(`students/${publicId}`);
        }
      }

      const updates = {
        name,
        lastName,
        dni,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        address,
        guardianName,
        guardianPhone,
        category,
        mail,
        state,
        profileImage,
        hasSiblingDiscount: hasSiblingDiscount !== undefined ? hasSiblingDiscount : undefined,
        club,
      };

      // Agregar campos médicos solo si están presentes en la solicitud
      if (isAsthmatic !== undefined) updates.isAsthmatic = isAsthmatic;
      if (hasHeadaches !== undefined) updates.hasHeadaches = hasHeadaches;
      if (hasSeizures !== undefined) updates.hasSeizures = hasSeizures;
      if (hasDizziness !== undefined) updates.hasDizziness = hasDizziness;
      if (hasEpilepsy !== undefined) updates.hasEpilepsy = hasEpilepsy;
      if (hasDiabetes !== undefined) updates.hasDiabetes = hasDiabetes;
      if (isAllergic !== undefined) {
        updates.isAllergic = isAllergic;
        if (isAllergic && allergyDetails !== undefined) updates.allergyDetails = allergyDetails;
        else if (!isAllergic) updates.allergyDetails = undefined;
      }
      if (takesMedication !== undefined) {
        updates.takesMedication = takesMedication;
        if (takesMedication && medicationDetails !== undefined) updates.medicationDetails = medicationDetails;
        else if (!takesMedication) updates.medicationDetails = undefined;
      }
      if (otherDiseases !== undefined) updates.otherDiseases = otherDiseases;
      if (bloodType !== undefined) updates.bloodType = bloodType;

      const student = await Student.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();

      if (!student) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
      }

      logger.info({ studentId: id }, 'Estudiante actualizado');
      res.status(200).json({ message: "Estudiante actualizado exitosamente", student });
    } catch (error) {
      logger.error({ error: error.message }, 'Error al actualizar estudiante');
      res.status(500).json({ message: 'Error al actualizar estudiante', error: error.message });
    }
  });
};

export const getStudentById = async (req, res) => {
  const { id } = sanitize(req.params);

  try {
    const student = await Student.findById(id).lean();
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.status(200).json(student);
  } catch (error) {
    logger.error({ error: error.message }, 'Error al obtener estudiante');
    res.status(500).json({ message: 'Error al obtener estudiante' });
  }
};