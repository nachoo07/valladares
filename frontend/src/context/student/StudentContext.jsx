import { useEffect, useState, createContext, useContext, useCallback, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { LoginContext } from "../login/LoginContext";

export const StudentsContext = createContext();

const StudentsProvider = ({ children }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const { auth, waitForAuth } = useContext(LoginContext);
  const cache = useRef(new Map());

  const obtenerEstudiantes = useCallback(async () => {
    if (auth !== "admin" && auth !== "user") return;
    if (cache.current.has("estudiantes")) {
      setEstudiantes(cache.current.get("estudiantes"));
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get("/api/students", {
        withCredentials: true,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      cache.current.set("estudiantes", data);
      setEstudiantes(data);
    } catch (error) {
      console.error("Error obteniendo estudiantes:", error);
      Swal.fire({
        title: "¡Error!",
        text: "No se pudieron obtener los estudiantes.",
        icon: "error",
        confirmButtonText: "Aceptar",
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
      cache.current.set(studentId, response.data);
      setSelectedStudent(response.data);
    } catch (error) {
      console.error("Error obteniendo estudiante por ID:", error);
      Swal.fire({
        title: "¡Error!",
        text: "No se pudo obtener el estudiante.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      setSelectedStudent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addEstudiante = useCallback(async (estudiante) => {
    if (auth !== "admin") return;
    try {
      setLoading(true);
      const formData = new FormData();
      const fields = [
        'name', 'lastName', 'dni', 'birthDate', 'address', 'mail', 'category',
        'club', 'guardianName', 'guardianPhone', 'state', 'hasSiblingDiscount',
        'isAsthmatic', 'hasHeadaches', 'hasSeizures', 'hasDizziness', 'hasEpilepsy',
        'hasDiabetes', 'isAllergic', 'allergyDetails', 'takesMedication',
        'medicationDetails', 'otherDiseases', 'bloodType'
      ];
      for (const key of fields) {
        if (estudiante[key] !== undefined && estudiante[key] !== null && estudiante[key] !== '') {
          formData.append(key, estudiante[key]);
        }
      }
      if (estudiante.profileImage instanceof File) {
        formData.append('profileImage', estudiante.profileImage);
      }
      const response = await axios.post("/api/students/create", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 201) {
        const newStudent = response.data.student || response.data;
        setEstudiantes((prev) => [...(Array.isArray(prev) ? prev : []), newStudent]);
        cache.current.set("estudiantes", [...(cache.current.get("estudiantes") || []), newStudent]);
        Swal.fire({
          title: "¡Éxito!",
          text: "El estudiante ha sido creado correctamente.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });
      } else {
        throw new Error("Respuesta inesperada del servidor.");
      }
    } catch (error) {
      console.error("Error al crear el estudiante:", error);
      const errorMessage = error.response?.data?.message || "Ha ocurrido un error al crear el estudiante.";
      Swal.fire({
        title: "¡Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const deleteEstudiante = useCallback(async (id) => {
    if (auth !== "admin") return;
    try {
      const confirmacion = await Swal.fire({
        title: "¿Estás seguro que deseas eliminar el estudiante?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (confirmacion.isConfirmed) {
        await axios.delete(`/api/students/delete/${id}`, {
          withCredentials: true,
        });
        setEstudiantes((prev) => prev.filter((estudiante) => estudiante._id !== id));
        cache.current.set("estudiantes", cache.current.get("estudiantes").filter((est) => est._id !== id));
        cache.current.delete(id);
        Swal.fire("¡Eliminado!", "Estudiante eliminado correctamente", "success");
      }
    } catch (error) {
      console.error("Error al eliminar estudiante:", error);
      Swal.fire("¡Error!", "No se pudo eliminar el estudiante", "error");
    }
  }, [auth]);

  const updateEstudiante = useCallback(async (estudiante) => {
    if (auth !== "admin") return;
    try {
      setLoading(true);
      const formData = new FormData();
      const fields = [
        'name', 'lastName', 'dni', 'birthDate', 'address', 'mail', 'category',
        'club', 'guardianName', 'guardianPhone', 'state', 'hasSiblingDiscount',
        'isAsthmatic', 'hasHeadaches', 'hasSeizures', 'hasDizziness', 'hasEpilepsy',
        'hasDiabetes', 'isAllergic', 'allergyDetails', 'takesMedication',
        'medicationDetails', 'otherDiseases', 'bloodType'
      ];
      for (const key of fields) {
        if (estudiante[key] !== undefined && estudiante[key] !== null && estudiante[key] !== '') {
          formData.append(key, estudiante[key]);
        }
      }
      if (estudiante.profileImage instanceof File) {
        formData.append('profileImage', estudiante.profileImage);
      }
      const response = await axios.put(`/api/students/update/${estudiante._id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200) {
        const updatedStudent = response.data.student || response.data;
        setEstudiantes((prev) =>
          prev.map((est) => (est._id === estudiante._id ? updatedStudent : est))
        );
        cache.current.set("estudiantes", cache.current.get("estudiantes").map((est) =>
          est._id === estudiante._id ? updatedStudent : est
        ));
        cache.current.set(estudiante._id, updatedStudent);
        Swal.fire({
          title: "¡Éxito!",
          text: "El estudiante ha sido actualizado correctamente.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });
      } else {
        throw new Error("Respuesta inesperada del servidor.");
      }
    } catch (error) {
      console.error("Error al actualizar estudiante:", error);
      Swal.fire({
        title: "¡Error!",
        text: error.response?.data?.message || "Ha ocurrido un error al actualizar el estudiante.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const countStudentsByState = useCallback((state) => {
    const estudiantesArray = Array.isArray(estudiantes) ? estudiantes : [];
    return estudiantesArray.filter((student) => student.state === state).length;
  }, [estudiantes]);

  useEffect(() => {
    const fetchData = async () => {
      await waitForAuth();
      if (auth === "admin" || auth === "user") {
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
        countStudentsByState,
      }}
    >
      {children}
    </StudentsContext.Provider>
  );
};

export default StudentsProvider;