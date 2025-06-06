import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  dni: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (v) => /^\d{7,9}$/.test(v),
      message: 'Dni must contain 7 to 9 digits.',
    },
  },
  birthDate: {
    type: Date,
    required: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  guardianName: {
    type: String,
    trim: true,
  },
  guardianPhone: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /^\d{10,15}$/.test(v),
      message: 'Guardian phone number must have between 10 and 15 digits.',
    },
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  mail: {
    type: String,
    lowercase: true,
    trim: true,
    default: '',
    validate: {
      validator: (v) => !v || /\S+@\S+\.\S+/.test(v),
      message: 'Invalid email format.',
    },
  },
  state: {
    type: String,
    enum: ['Activo', 'Inactivo'],
    default: 'Activo',
  },
  profileImage: {
    type: String,
    trim: true,
    default: 'https://i.pinimg.com/736x/24/f2/25/24f22516ec47facdc2dc114f8c3de7db.jpg',
  },
  hasSiblingDiscount: {
    type: Boolean,
    default: false,
  },
  club: {
    type: String,
    required: [true, 'Club is required.'],
    enum: {
      values: ['Valladares', 'El Palmar'],
      message: 'Club must be either Valladares or El Palmar.',
    },
    trim: true,
    set: (v) => (v ? sanitizeHtml(v) : undefined),
  },
  // New medical fields (no defaults)
  isAsthmatic: {
    type: Boolean,
  },
  hasHeadaches: {
    type: Boolean,
  },
  hasSeizures: {
    type: Boolean,
  },
  hasDizziness: {
    type: Boolean,
  },
  hasEpilepsy: {
    type: Boolean,
  },
  hasDiabetes: {
    type: Boolean,
  },
  isAllergic: {
    type: Boolean,
  },
  allergyDetails: {
    type: String,
    trim: true,
    set: (v) => (v ? sanitizeHtml(v) : undefined),
    validate: {
      validator: function (v) {
        // allergyDetails is required only if isAllergic is true
        return !this.isAllergic || (v && v.length > 0);
      },
      message: 'Allergy details are required if the student is allergic.',
    },
  },
  takesMedication: {
    type: Boolean,
  },
  medicationDetails: {
    type: String,
    trim: true,
    set: (v) => (v ? sanitizeHtml(v) : undefined),
    validate: {
      validator: function (v) {
        // medicationDetails is required only if takesMedication is true
        return !this.takesMedication || (v && v.length > 0);
      },
      message: 'Medication details are required if the student takes medication.',
    },
  },
  otherDiseases: {
    type: String,
    trim: true,
    set: (v) => (v ? sanitizeHtml(v) : undefined),
  },
  bloodType: {
    type: String,
    trim: true,
    set: (v) => (v ? sanitizeHtml(v) : undefined),
  },
}, {
  timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);
export default Student;