import { useEffect, useState, createContext, useContext, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { LoginContext } from "../login/LoginContext";

export const SharesContext = createContext();

const SharesProvider = ({ children }) => {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const { auth, waitForAuth } = useContext(LoginContext); // Añadimos waitForAuth

  const obtenerCuotas = useCallback(async () => {
    if (auth !== "admin") return;
    try {
      setLoading(true);
      const response = await axios.get("/api/shares", {
        withCredentials: true,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setCuotas(data);
    } catch (error) {
      console.error("Error obteniendo cuotas:", error);
      Swal.fire("¡Error!", "No se pudieron obtener las cuotas.", "error");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const obtenerCuotasPorEstudiante = useCallback(async (studentId) => {
    if (!studentId) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/shares/student/${studentId}`, {
        withCredentials: true,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setCuotas((prev) => [
        ...prev.filter((cuota) => cuota.student?._id !== studentId),
        ...data,
      ]);
    } catch (error) {
      console.error("Error obteniendo cuotas por estudiante:", error);
      Swal.fire("¡Error!", "No se pudieron obtener las cuotas del estudiante.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const addCuota = useCallback(async (cuota) => {
    if (auth !== "admin") return;
    try {
      const response = await axios.post("/api/shares/create", cuota, {
        withCredentials: true,
      });
      const newCuota = response.data;
      setCuotas((prev) => [...(Array.isArray(prev) ? prev : []), newCuota]);
      Swal.fire("¡Éxito!", "La cuota ha sido creada correctamente", "success");
    } catch (error) {
      console.error("Error al crear la cuota:", error);
      Swal.fire("¡Error!", "Ha ocurrido un error al crear la cuota", "error");
    }
  }, [auth]);

  const deleteCuota = useCallback(async (id) => {
    if (auth !== "admin") return;
    try {
      const confirmacion = await Swal.fire({
        title: "¿Estás seguro que deseas eliminar la cuota?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (confirmacion.isConfirmed) {
        await axios.delete(`/api/shares/delete/${id}`, {
          withCredentials: true,
        });
        setCuotas((prev) => prev.filter((cuota) => cuota._id !== id));
        Swal.fire("¡Eliminada!", "La cuota ha sido eliminada correctamente", "success");
      }
    } catch (error) {
      console.error("Error al eliminar cuota:", error);
      Swal.fire("¡Error!", "Ha ocurrido un error al eliminar la cuota", "error");
    }
  }, [auth]);

  const updateCuota = useCallback(async (cuota) => {
    if (auth !== "admin") return;
    try {
      const response = await axios.put(`/api/shares/update/${cuota._id}`, cuota, {
        withCredentials: true,
      });
      const updatedCuota = response.data;
      setCuotas((prev) =>
        prev.map((c) => (c._id === updatedCuota._id ? updatedCuota : c))
      );
      Swal.fire("¡Éxito!", "La cuota ha sido actualizada correctamente", "success");
    } catch (error) {
      console.error("Error al actualizar cuota:", error);
      Swal.fire("¡Error!", "Ha ocurrido un error al actualizar la cuota", "error");
    }
  }, [auth]);

  const obtenerCuotasPorFecha = useCallback(async (fecha) => {
    try {
      const response = await axios.get(`/api/shares/date/${fecha}`, {
        withCredentials: true,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setCuotas((prev) => [...prev.filter((c) => new Date(c.date).toISOString().split('T')[0] !== fecha), ...data]);
      return data;
    } catch (error) {
      console.error('Error obteniendo cuotas por fecha:', error);
      Swal.fire('¡Error!', 'No se pudieron obtener las cuotas por fecha.', 'error');
      return [];
    }
  }, []);

  const obtenerCuotasPorFechaRange = useCallback(async (startDate, endDate) => {
    try {
      const response = await axios.get(`/api/shares/date-range?startDate=${startDate}&endDate=${endDate}`, {
        withCredentials: true,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setCuotas((prev) => [...prev, ...data]);
      return data;
    } catch (error) {
      console.error('Error obteniendo cuotas por rango de fechas:', error);
      Swal.fire('¡Error!', 'No se pudieron obtener las cuotas por rango de fechas.', 'error');
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await waitForAuth(); // Espera a que la autenticación esté lista
      if (auth === "admin") {
        await obtenerCuotas();
      }
    };
    fetchData();
  }, [auth, obtenerCuotas, waitForAuth]); // Añadimos waitForAuth como dependencia

  return (
    <SharesContext.Provider
      value={{
        cuotas,
        loading,
        obtenerCuotas,
        obtenerCuotasPorEstudiante,
        addCuota,
        deleteCuota,
        updateCuota,
        obtenerCuotasPorFecha,
        obtenerCuotasPorFechaRange,
      }}
    >
      {children}
    </SharesContext.Provider>
  );
};

export default SharesProvider;