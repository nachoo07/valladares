
import { useEffect, useState, useContext, useCallback, useRef, createContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { LoginContext } from '../login/LoginContext';
import { format } from 'date-fns';

export const StudentsContext = createContext();

const StudentsProvider = ({ children }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const { auth, waitForAuth } = useContext(LoginContext);
  const cache = useRef(new Map());

  const uploadToCloudinary = async (file) => {
    try {
      const { data } = await axios.get('/api/students/cloudinary-signature', {
        withCredentials: true,
      });

      if (!data.signature || !data.timestamp || !data.cloudName || !data.apiKey) {
        throw new Error('Respuesta inválida del endpoint de firma de Cloudinary');
      }

      const { signature, timestamp, cloudName, apiKey } = data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('api_key', apiKey);
      formData.append('folder', 'students');

      const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
      if (!response.data.secure_url) {
        throw new Error('No se recibió una URL de imagen válida desde Cloudinary');
      }
      return response.data.secure_url;
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error);
      let errorMessage = 'No se pudo subir la imagen';
      if (error.response) {
        errorMessage = `Error del servidor: ${error.response.data.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No se recibió respuesta del servidor de Cloudinary';
      } else {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  const obtenerEstudiantes = useCallback(async () => {
    if (auth !== 'admin' && auth !== 'user') return;
    if (cache.current.has('estudiantes')) {
      setEstudiantes(cache.current.get('estudiantes'));
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get('/api/students', {
        withCredentials: true,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      // Formatear fechas desde la base de datos
      const formattedData = data.map(student => ({
        ...student,
        birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
      }));
      cache.current.set('estudiantes', formattedData);
      setEstudiantes(formattedData);
    } catch (error) {
      console.error('Error obteniendo estudiantes:', error);
      Swal.fire({
        title: '¡Error!',
        text: 'No se pudieron obtener los estudiantes.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const obtenerEstudiantePorId = useCallback(async (studentId) => {
    if (!studentId) return;
    if (cache.current.has(studentId)) {
      setSelectedStudent(cache.current.get(studentId));
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`/api/students/${studentId}`, {
        withCredentials: true,
      });
      const student = {
        ...response.data,
        birthDate: response.data.birthDate ? new Date(response.data.birthDate).toISOString().split('T')[0] : '',
      };
      cache.current.set(studentId, student);
      setSelectedStudent(student);
    } catch (error) {
      console.error('Error obteniendo estudiante por ID:', error);
      Swal.fire({
        title: '¡Error!',
        text: 'No se pudo obtener el estudiante.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      setSelectedStudent(null);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const addEstudiante = useCallback(async (estudiante) => {
    if (auth !== 'admin') return;
    try {
      setLoading(true);
      let profileImageUrl = estudiante.profileImage;
      if (estudiante.profileImage instanceof File) {
        profileImageUrl = null; // El backend manejará la subida
      } else if (!profileImageUrl) {
        profileImageUrl = 'https://i.pinimg.com/736x/24/f2/25/24f22516ec47facdc2dc114f8c3de7db.jpg';
      }

      const estudianteData = {
        ...estudiante,
        profileImage: profileImageUrl,
        birthDate: estudiante.birthDate || '',
      };

      const formData = new FormData();
      Object.keys(estudianteData).forEach(key => {
        if (key === 'profileImage' && estudiante.profileImage instanceof File) {
          formData.append('profileImageFile', estudiante.profileImage);
        } else if (estudianteData[key] !== undefined && estudianteData[key] !== null) {
          formData.append(key, typeof estudianteData[key] === 'boolean' ? estudianteData[key].toString() : estudianteData[key]);
        }
      });

      const response = await axios.post('/api/students/create', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 201) {
        const newStudent = response.data.student || response.data;
        const formattedStudent = {
          ...newStudent,
          birthDate: newStudent.birthDate ? new Date(newStudent.birthDate).toISOString().split('T')[0] : '',
        };
        setEstudiantes(prev => [...(Array.isArray(prev) ? prev : []), formattedStudent]);
        cache.current.set('estudiantes', [...(cache.current.get('estudiantes') || []), formattedStudent]);
        Swal.fire({
          title: '¡Éxito!',
          text: 'El estudiante ha sido creado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });
      } else {
        throw new Error('Respuesta inesperada del servidor.');
      }
    } catch (error) {
      console.error('Error al crear el estudiante:', error);
      let errorMessage = 'Ha ocurrido un error al crear el estudiante: ';
      const rawMessage = error.response?.data?.error || error.message;

      // Mapa de traducción para nombres de campos
      const fieldTranslations = {
        name: 'Nombre',
        lastName: 'Apellido',
        dni: 'DNI',
        birthDate: 'Fecha de Nacimiento',
        address: 'Dirección',
        category: 'Categoría',
        club: 'Club',
        turno: 'Turno',
        mail: 'Correo Electrónico',
        guardianName: 'Nombre del Tutor',
        guardianPhone: 'Teléfono del Tutor',
      };

      if (rawMessage.includes('duplicate key error')) {
        const match = rawMessage.match(/index: (\w+)_1/);
        const field = match ? match[1] : 'desconocido';
        const readableField = fieldTranslations[field] || field;
        errorMessage += `${readableField} duplicado.`;
      } else if (rawMessage.includes('Faltan datos obligatorios')) {
        errorMessage += 'Faltan campos obligatorios. Por favor, completa todos los campos requeridos.';
      } else if (rawMessage.includes('DNI debe contener')) {
        errorMessage += 'El DNI debe contener entre 8 y 10 dígitos.';
      } else if (rawMessage.includes('Club debe ser')) {
        errorMessage += 'El club debe ser "Valladares" o "El Palmar".';
      } else if (rawMessage.includes('Turno debe ser')) {
        errorMessage += 'El turno debe ser "A" o "B".';
      } else if (rawMessage.includes('Formato de fecha de nacimiento inválido')) {
        errorMessage += 'La fecha de nacimiento tiene un formato inválido.';
      } else if (rawMessage.includes('Error al procesar imagen')) {
        errorMessage += 'Hubo un problema al subir la imagen de perfil.';
      } else {
        errorMessage += rawMessage;
      }
      Swal.fire({
        title: '¡Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const deleteEstudiante = useCallback(async (id) => {
    if (auth !== 'admin') return;
    try {
      const confirmacion = await Swal.fire({
        title: '¿Estás seguro que deseas eliminar el estudiante?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (confirmacion.isConfirmed) {
        await axios.delete(`/api/students/delete/${id}`, {
          withCredentials: true,
        });
        setEstudiantes(prev => prev.filter(estudiante => estudiante._id !== id));
        cache.current.set('estudiantes', cache.current.get('estudiantes').filter(est => est._id !== id));
        cache.current.delete(id);
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El estudiante ha sido eliminado correctamente',
          icon: 'success',
        });
      }
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      Swal.fire({
        title: '¡Error!',
        text: 'No se pudo eliminar el estudiante',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  }, [auth]);

  const updateEstudiante = useCallback(async (estudiante) => {
    if (auth !== 'admin') return;
    try {
      setLoading(true);
      let profileImageUrl = estudiante.profileImage;
      if (estudiante.profileImage instanceof File) {
        profileImageUrl = null; // El backend manejará la subida
      } else if (!profileImageUrl) {
        profileImageUrl = 'https://i.pinimg.com/736x/24/f2/25/24f22516ec47facdc2dc114f8c3de7db.jpg';
      }
      const estudianteData = {
        ...estudiante,
        profileImage: profileImageUrl,
        birthDate: estudiante.birthDate || '',
      };

      const formData = new FormData();
      Object.keys(estudianteData).forEach(key => {
        if (key === 'profileImage' && estudiante.profileImage instanceof File) {
          formData.append('profileImageFile', estudiante.profileImage);
        } else if (estudianteData[key] !== undefined && estudianteData[key] !== null) {
          formData.append(key, typeof estudianteData[key] === 'boolean' ? estudianteData[key].toString() : estudianteData[key]);
        }
      });

      const response = await axios.put(`/api/students/update/${estudiante._id}`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 200) {
        const updatedStudent = response.data.student || response.data;
        const formattedStudent = {
          ...updatedStudent,
          birthDate: updatedStudent.birthDate ? new Date(updatedStudent.birthDate).toISOString().split('T')[0] : '',
        };
        setEstudiantes(prev =>
          prev.map(est => (est._id === estudiante._id ? formattedStudent : est))
        );
        cache.current.set('estudiantes', cache.current.get('estudiantes').map(est =>
          est._id === estudiante._id ? formattedStudent : est
        ));
        cache.current.set(estudiante._id, formattedStudent);
        Swal.fire({
          title: '¡Éxito!',
          text: 'El estudiante ha sido actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });
      } else {
        throw new Error('Respuesta inesperada del servidor.');
      }
    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
      let errorMessage = 'Ha ocurrido un error al actualizar el estudiante: ';
      const rawMessage = error.response?.data?.error || error.message;

      const fieldTranslations = {
        name: 'Nombre',
        lastName: 'Apellido',
        dni: 'DNI',
        birthDate: 'Fecha de Nacimiento',
        address: 'Dirección',
        category: 'Categoría',
        club: 'Club',
        turno: 'Turno',
        mail: 'Correo Electrónico',
        guardianName: 'Nombre del Tutor',
        guardianPhone: 'Teléfono del Tutor',
      };

      if (rawMessage.includes('Estudiante no encontrado')) {
        errorMessage += 'El estudiante no fue encontrado.';
      } else if (rawMessage.includes('duplicate key error')) {
        const match = rawMessage.match(/index: (\w+)_1/);
        const field = match ? match[1] : 'desconocido';
        const readableField = fieldTranslations[field] || field;
        errorMessage += `${readableField} duplicado.`;
      } else if (rawMessage.includes('Faltan datos obligatorios')) {
        errorMessage += 'Faltan campos obligatorios. Por favor, completa todos los campos requeridos.';
      } else if (rawMessage.includes('DNI debe contener')) {
        errorMessage += 'El DNI debe contener entre 8 y 10 dígitos.';
      } else if (rawMessage.includes('Club debe ser')) {
        errorMessage += 'El club debe ser "Valladares" o "El Palmar".';
      } else if (rawMessage.includes('Turno debe ser')) {
        errorMessage += 'El turno debe ser "A" o "B".';
      } else if (rawMessage.includes('Formato de fecha de nacimiento inválido')) {
        errorMessage += 'La fecha de nacimiento tiene un formato inválido.';
      } else if (rawMessage.includes('Error al procesar imagen')) {
        errorMessage += 'Hubo un problema al subir la imagen de perfil.';
      } else {
        errorMessage += rawMessage;
      }

      Swal.fire({
        title: '¡Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const importStudents = useCallback(async (studentList) => {
    if (auth !== 'admin') {
      Swal.fire({
        title: '¡Error!',
        text: 'No tienes permisos para importar alumnos',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Enviando lista de estudiantes para importar:', studentList);
      const response = await axios.post('/api/students/import', { students: studentList }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Respuesta del backend:', response.data);

      const { success, students: importedStudents = [], errors = [], message } = response.data;

      const fieldTranslations = {
        name: 'Nombre',
        lastName: 'Apellido',
        dni: 'DNI',
        birthDate: 'Fecha de Nacimiento',
        address: 'Dirección',
        category: 'Categoría',
        club: 'Club',
        turno: 'Turno',
        mail: 'Correo Electrónico',
        guardianName: 'Nombre del Tutor',
        guardianPhone: 'Teléfono del Tutor',
      };

      let swalMessage = '';
      let icon = 'error';

      if (success || importedStudents.length > 0) {
        console.log('Estudiantes recibidos del backend:', importedStudents);
        const formattedStudents = importedStudents.map(student => ({
          ...student,
          birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
        }));
        console.log('Estudiantes formateados:', formattedStudents);
        setEstudiantes(prev => [...prev, ...formattedStudents]);
        cache.current.set('estudiantes', [...(cache.current.get('estudiantes') || []), ...formattedStudents]);
        swalMessage = `Se importaron ${importedStudents.length} estudiantes correctamente.`;
        icon = 'success';
      } else {
        swalMessage = message || 'No se importaron estudiantes debido a errores.';
      }

      if (errors.length > 0) {
        if (swalMessage) swalMessage += '<br /><br />';
        swalMessage += '<strong>Errores encontrados:</strong><ul>';
        const errorGroups = errors.reduce((acc, error) => {
          const rowMatch = error.match(/Fila (\d+)/);
          const row = rowMatch ? rowMatch[1] : 'Desconocida';
          const dniMatch = error.match(/DNI (\d+)/);
          const dni = dniMatch ? dniMatch[1] : 'Desconocido';
          let errorType = 'Otros errores';
          let customizedMessage = error;

          if (error.includes('Faltan campos obligatorios')) {
            errorType = 'Campos obligatorios faltantes';
            const fieldsMatch = error.match(/Faltan campos obligatorios: (.+)$/);
            if (fieldsMatch) {
              const missingFields = fieldsMatch[1].split(', ').map(field => fieldTranslations[field] || field);
              customizedMessage = `Fila ${row}, DNI ${dni}: Faltan campos obligatorios: ${missingFields.join(', ')}`;
            }
          } else if (error.includes('DNI debe contener')) {
            errorType = 'DNI con formato inválido';
            customizedMessage = `Fila ${row}, DNI ${dni}: DNI debe contener entre 8 y 10 dígitos`;
          } else if (error.includes('DNI ya existe')) {
            errorType = 'DNI duplicado';
            customizedMessage = `Fila ${row}, DNI ${dni}: DNI ya existe`;
          } else if (error.includes('Club debe ser')) {
            errorType = 'Club inválido';
            customizedMessage = `Fila ${row}, DNI ${dni}: Club debe ser "Valladares" o "El Palmar"`;
          } else if (error.includes('Turno debe ser')) {
            errorType = 'Turno inválido';
            customizedMessage = `Fila ${row}, DNI ${dni}: Turno debe ser "A" o "B"`;
          } else if (error.includes('Formato de fecha de nacimiento inválido')) {
            errorType = 'Fecha de nacimiento inválida';
            customizedMessage = `Fila ${row}, DNI ${dni}: Formato de fecha de nacimiento inválido`;
          } else if (error.includes('Error al procesar la imagen')) {
            errorType = 'Error en imagen';
            customizedMessage = `Fila ${row}, DNI ${dni}: Error al procesar la imagen`;
          }

          if (!acc[errorType]) acc[errorType] = [];
          acc[errorType].push(customizedMessage);
          return acc;
        }, {});

        for (const [errorType, errorMessages] of Object.entries(errorGroups)) {
          swalMessage += `<li><strong>${errorType}:</strong> ${errorMessages.length} casos<ul>`;
          errorMessages.slice(0, 5).forEach(msg => {
            swalMessage += `<li>${msg}</li>`;
          });
          if (errorMessages.length > 5) {
            swalMessage += `<li>(y ${errorMessages.length - 5} errores más...)</li>`;
          }
          swalMessage += '</ul></li>';
        }
        swalMessage += '</ul>';
      }

      Swal.fire({
        title: icon === 'success' ? '¡Éxito!' : '¡Error!',
        html: swalMessage,
        icon,
        confirmButtonText: 'Aceptar',
        width: '600px',
        customClass: {
          htmlContainer: 'swal2-html-container-scroll',
        },
      });

      await obtenerEstudiantes();
    } catch (error) {
      console.error('Error al importar estudiantes:', error);
      console.log('Error response:', error.response?.data);
      let errorMessage = 'Ha ocurrido un error al importar estudiantes: ';
      const rawMessage = error.response?.data?.message || error.response?.data?.error || error.message;

      const fieldTranslations = {
        name: 'Nombre',
        lastName: 'Apellido',
        dni: 'DNI',
        birthDate: 'Fecha de Nacimiento',
        address: 'Dirección',
        category: 'Categoría',
        club: 'Club',
        turno: 'Turno',
        mail: 'Correo Electrónico',
        guardianName: 'Nombre del Tutor',
        guardianPhone: 'Teléfono del Tutor',
      };

      if (rawMessage.includes('Debe proporcionar una lista de estudiantes')) {
        errorMessage += 'Debe proporcionar una lista de estudiantes válida.';
      } else if (error.response?.data?.errors?.length > 0) {
        errorMessage += '<br /><strong>Errores encontrados:</strong><ul>';
        const errors = error.response.data.errors;
        const errorGroups = errors.reduce((acc, error) => {
          const rowMatch = error.match(/Fila (\d+)/);
          const row = rowMatch ? rowMatch[1] : 'Desconocida';
          const dniMatch = error.match(/DNI (\d+)/);
          const dni = dniMatch ? dniMatch[1] : 'Desconocido';
          let errorType = 'Otros errores';
          let customizedMessage = error;

          if (error.includes('Faltan campos obligatorios')) {
            errorType = 'Campos obligatorios faltantes';
            const fieldsMatch = error.match(/Faltan campos obligatorios: (.+)$/);
            if (fieldsMatch) {
              const missingFields = fieldsMatch[1].split(', ').map(field => fieldTranslations[field] || field);
              customizedMessage = `Fila ${row}, DNI ${dni}: Faltan campos obligatorios: ${missingFields.join(', ')}`;
            }
          } else if (error.includes('DNI debe contener')) {
            errorType = 'DNI con formato inválido';
            customizedMessage = `Fila ${row}, DNI ${dni}: DNI debe contener entre 8 y 10 dígitos`;
          } else if (error.includes('DNI ya existe')) {
            errorType = 'DNI duplicado';
            customizedMessage = `Fila ${row}, DNI ${dni}: DNI ya existe`;
          } else if (error.includes('Club debe ser')) {
            errorType = 'Club inválido';
            customizedMessage = `Fila ${row}, DNI ${dni}: Club debe ser "Valladares" o 'B"`;
          } else if (error.includes('Turno debe ser')) {
            errorType = 'Turno inválido';
            customizedMessage = `Fila ${row}, DNI ${dni}: Turno debe ser "A" o 'B'`;
          } else if (error.includes('Formato de fecha de nacimiento inválido')) {
            errorType = 'Fecha de nacimiento inválida';
            customizedMessage = `Fila ${row}, DNI ${dni}: Formato de fecha de nacimiento inválido`;
          } else if (error.includes('Error al procesar la imagen')) {
            errorType = 'Error en imagen';
            customizedMessage = `Fila ${row}, DNI ${dni}: Error al procesar la imagen`;
          }

          if (!acc[errorType]) acc[errorType] = [];
          acc[errorType].push(customizedMessage);
          return acc;
        }, {});

        for (const [errorType, errorMessages] of Object.entries(errorGroups)) {
          errorMessage += `<li><strong>${errorType}:</strong> ${errorMessages.length} casos<ul>`;
          errorMessages.slice(0, 5).forEach(msg => {
            errorMessage += `<li>${msg}</li>`;
          });
          if (errorMessages.length > 5) {
            errorMessage += `<li>(y ${errorMessages.length - 5} errores más...)</li>`;
          }
          errorMessage += '</ul></li>';
        }
        errorMessage += '</ul>';
      } else {
        errorMessage += rawMessage;
      }

      Swal.fire({
        title: '¡Error!',
        html: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        width: '600px',
        customClass: {
          htmlContainer: 'swal2-html-container-scroll',
        },
      });
    } finally {
      setLoading(false);
    }
  }, [auth, obtenerEstudiantes]);

  const countStudentsByState = useCallback((state) => {
    const studentsArray = Array.isArray(estudiantes) ? estudiantes : [];
    return studentsArray.filter(student => student.state === state).length;
  }, [estudiantes]);

  useEffect(() => {
    const fetchData = async () => {
      await waitForAuth();
      if (auth === 'admin' || auth === 'user') {
        await obtenerEstudiantes();
      }
    };
    fetchData();
  }, [auth, obtenerEstudiantes, waitForAuth]);

  return (
    <StudentsContext.Provider
      value={{
        estudiantes,
        selectedStudent,
        loading,
        obtenerEstudiantes,
        obtenerEstudiantePorId,
        addEstudiante,
        deleteEstudiante,
        updateEstudiante,
        importStudents,
        countStudentsByState,
      }}
    >
      {children}
    </StudentsContext.Provider>
  );
};

export default StudentsProvider;
