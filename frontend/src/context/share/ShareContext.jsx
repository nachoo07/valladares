import { useEffect, useState, createContext, useContext, useCallback } from "react";
import axios from "axios";
import { LoginContext } from "../login/LoginContext";

export const SharesContext = createContext();

const SharesProvider = ({ children }) => {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const { auth, waitForAuth } = useContext(LoginContext);

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
      setCuotas((prev) => [...prev.filter((cuota) => cuota.student?._id !== studentId), ...data]);
    } catch (error) {
      console.error("Error obteniendo cuotas por estudiante:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCuota = useCallback(async (cuota) => {
    if (auth !== "admin") return;
    try {
      setLoading(true);
      const response = await axios.post("/api/shares/create", cuota, {
        withCredentials: true,
      });
      const newCuota = response.data;
      setCuotas((prev) => [...(Array.isArray(prev) ? prev : []), newCuota]);
    } catch (error) {
      console.error("Error al crear la cuota:", error);
      throw new Error("Ha ocurrido un error al crear la cuota");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const deleteCuota = useCallback(async (id) => {
    if (auth !== "admin") return;
    try {
      setLoading(true);
      await axios.delete(`/api/shares/delete/${id}`, {
        withCredentials: true,
      });
      setCuotas((prev) => prev.filter((cuota) => cuota._id !== id));
    } catch (error) {
      console.error("Error al eliminar cuota:", error);
      throw new Error("Ha ocurrido un error al eliminar la cuota");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const updateCuota = useCallback(async (cuota) => {
    if (auth !== "admin") return;
    try {
      setLoading(true);
      const response = await axios.put(`/api/shares/update/${cuota._id}`, cuota, {
        withCredentials: true,
      });
      const updatedCuota = response.data;
      setCuotas((prev) =>
        prev.map((c) => (c._id === updatedCuota._id ? updatedCuota : c))
      );
    } catch (error) {
      console.error("Error al actualizar cuota:", error);
      throw new Error("Ha ocurrido un error al actualizar la cuota");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const obtenerCuotasPorFecha = useCallback(async (fecha) => {
    try {
      setLoading(true);
      setCuotas([]); // Reinicia el estado antes de cargar nuevos datos
      const response = await axios.get(`/api/shares/date/${fecha}`, {
        withCredentials: true,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setCuotas(data);
      return data;
    } catch (error) {
      console.error('Error obteniendo cuotas por fecha:', error);
      throw new Error('No se pudieron obtener las cuotas por fecha.');
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerCuotasPorFechaRange = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      setCuotas([]); // Reinicia el estado
      const response = await axios.get(`/api/shares/date-range?startDate=${startDate}&endDate=${endDate}`, {
        withCredentials: true,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setCuotas(data);
      return data;
    } catch (error) {
      console.error('Error obteniendo cuotas por rango de fechas:', error);
      throw new Error('No se pudieron obtener las cuotas por rango de fechas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await waitForAuth();
      if (auth === "admin") {
        await obtenerCuotas();
      }
    };
    fetchData();
  }, [auth, obtenerCuotas, waitForAuth]);

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
        setCuotas,
      }}
    >
      {children}
    </SharesContext.Provider>
  );
};

export default SharesProvider;