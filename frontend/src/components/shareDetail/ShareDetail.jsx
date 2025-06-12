import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaSearch, FaBars, FaTimes, FaList, FaUsers, FaMoneyBill, FaChartBar, FaExchangeAlt,
  FaCalendarCheck, FaUserCog, FaCog, FaEnvelope, FaClipboardList, FaHome, FaArrowLeft, FaUserCircle,
  FaChevronDown, FaEdit, FaTrash, FaMoneyBillWave, FaPlus, FaSpinner
} from "react-icons/fa";
import { StudentsContext } from "../../context/student/StudentContext";
import { SharesContext } from "../../context/share/ShareContext";
import { LoginContext } from "../../context/login/LoginContext";
import SendVoucherEmail from "../voucherEmail/SendVoucherEmail";
import ShareFormModal from "../modalShare/ShareFormModal";
import AppNavbar from "../navbar/AppNavbar";
import "./shareDetail.css";
import logo from '../../assets/logo.png';

const ShareDetail = () => {
  const { selectedStudent, obtenerEstudiantePorId, loading: loadingStudent } = useContext(StudentsContext);
  const { cuotas, obtenerCuotasPorEstudiante, addCuota, updateCuota, deleteCuota, loading: loadingCuotas } = useContext(SharesContext);
  const { auth, logout, userData } = useContext(LoginContext);
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const hasFetched = useRef(false);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCuota, setSelectedCuota] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth >= 768);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sendingCuotaId, setSendingCuotaId] = useState(null);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const availableYears = ["2025", "2026", "2027"];

  // Leer el parámetro 'page' de la URL
  const queryParams = new URLSearchParams(location.search);
  const page = queryParams.get('page') || 1;

  const menuItems = [
    { name: "Inicio", route: "/", icon: <FaHome />, category: "principal" },
    { name: "Alumnos", route: "/student", icon: <FaUsers />, category: "principal" },
    { name: "Cuotas", route: "/share", icon: <FaMoneyBill />, category: "finanzas" },
    { name: "Reportes", route: "/report", icon: <FaChartBar />, category: "informes" },
    { name: "Movimientos", route: "/motion", icon: <FaExchangeAlt />, category: "finanzas" },
    { name: "Asistencia", route: "/attendance", icon: <FaCalendarCheck />, category: "principal" },
    { name: "Usuarios", route: "/user", icon: <FaUserCog />, category: "configuracion" },
    { name: "Ajustes", route: "/settings", icon: <FaCog />, category: "configuracion" },
    { name: "Envios de Mail", route: "/email-notifications", icon: <FaEnvelope />, category: "comunicacion" },
    { name: "Listado de Alumnos", route: "/liststudent", icon: <FaClipboardList />, category: "informes" },
    { name: 'Lista de Movimientos', route: '/listeconomic', icon: <FaList />, category: 'finanzas' }
  ];

  useEffect(() => {
    if (studentId && !hasFetched.current) {
      hasFetched.current = true;
      if (!selectedStudent || selectedStudent._id !== studentId) {
        obtenerEstudiantePorId(studentId);
      }
      obtenerCuotasPorEstudiante(studentId);
    }
  }, [studentId, obtenerEstudiantePorId, obtenerCuotasPorEstudiante]);

  useEffect(() => {
    filterData();
  }, [cuotas, selectedYear, selectedStudent]);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      if (newWidth < 768) {
        setIsMenuOpen(false);
      } else {
        setIsMenuOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filterData = () => {
    if (!selectedStudent || !Array.isArray(cuotas)) {
      setFilteredData([]);
      return;
    }
    const filtered = cuotas
      .filter((cuota) => cuota.student?._id === selectedStudent?._id && new Date(cuota.date).getFullYear().toString() === selectedYear)
      .sort((a, b) => new Date(a.date).getMonth() - new Date(b.date).getMonth());
    setFilteredData(filtered);
  };

  const today = new Date().toISOString().split("T")[0];

  const handleSave = async (cuotaData) => {
    try {
      if (isEditing) {
        await updateCuota(cuotaData);
      } else {
        await addCuota(cuotaData);
      }
      await obtenerCuotasPorEstudiante(studentId);
      setSelectedCuota(null);
      setIsEditing(false);
      setShowModal(false);
    } catch (error) {
      setAlertMessage("Error al guardar la cuota. Intenta de nuevo.");
      setShowAlert(true);
      console.error("Error en handleSave:", error);
    }
  };

  const handleEditClick = (cuota) => {
    setSelectedCuota(cuota);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCreateClick = () => {
    setSelectedCuota(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCuota(id);
      await obtenerCuotasPorEstudiante(studentId);
    } catch (error) {
      setAlertMessage("Error al eliminar la cuota. Intenta de nuevo.");
      setShowAlert(true);
      console.error("Error en handleDelete:", error);
    }
  };

  const handleSendingStart = (cuotaId) => {
    setSendingCuotaId(cuotaId);
  };

  const handleSendingEnd = () => {
    setSendingCuotaId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  };

  const formatMonth = (dateString) => months[new Date(dateString).getMonth()];

  const usedMonths = filteredData.map((cuota) => new Date(cuota.date).getMonth() + 1);
  const availableMonths = months.filter((_, index) => !usedMonths.includes(index + 1));

  const handleFilterChange = (e) => {
    const { name, checked } = e.target;
    if (checked) {
      setSelectedYear(name);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = async () => {
    logout();
    navigate("/login");
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const handleBack = () => navigate(`/share?page=${page}`);

  return (
    <div className="app-container">
      {windowWidth <= 576 && (
        <AppNavbar
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      )}
      {windowWidth > 576 && (
        <header className="desktop-nav-header">
          <div className="header-logo-setting" onClick={() => navigate('/')}>
            <img src={logo} alt="Valladares Fútbol" className="logo-image" />
          </div>
          <div className="nav-right-section">
            <div
              className="profile-container"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <FaUserCircle className="profile-icon" />
              <span className="profile-greeting">
                Hola, {userData?.name || "Usuario"}
              </span>
              <FaChevronDown className={`arrow-icon ${isProfileOpen ? "rotated" : ""}`} />
              {isProfileOpen && (
                <div className="profile-menu">
                  <div
                    className="menu-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/user");
                      setIsProfileOpen(false);
                    }}
                  >
                    <FaUserCog className="option-icon" /> Mi Perfil
                  </div>
                  <div
                    className="menu-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/settings");
                      setIsProfileOpen(false);
                    }}
                  >
                    <FaCog className="option-icon" /> Configuración
                  </div>
                  <div className="menu-separator"></div>
                  <div
                    className="menu-option logout-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                      setIsProfileOpen(false);
                    }}
                  >
                    <FaUserCircle className="option-icon" /> Cerrar Sesión
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <div className="dashboard-container">
        <aside className={`sidebar ${isMenuOpen ? "open" : "closed"}`}>
          <nav className="sidebar-nav">
            <div className="sidebar-section">
              <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
              <ul className="sidebar-menu">
                {menuItems.map((item, index) => (
                  <li
                    key={index}
                    className={`sidebar-menu-item ${item.route === "/share" ? "active" : ""}`}
                    onClick={() => (item.action ? item.action() : navigate(item.route))}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-text">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>
        <div className="content-container">
          {loadingStudent || !selectedStudent ? (
            <p className="no-data">Cargando datos del estudiante...</p>
          ) : (
            <>
              <section className="dashboard-welcome">
                <div className="welcome-text">
                  <h1>Cuotas de {selectedStudent.name} {selectedStudent.lastName}</h1>
                </div>
              </section>
              <section className="cuotas-filter">
                <div className="filter-actions">
                  <div className="checkbox-filters">
                    {availableYears.map((year) => (
                      <label key={year} className="checkbox-label">
                        <input
                          type="checkbox"
                          name={year}
                          checked={selectedYear === year}
                          onChange={handleFilterChange}
                        />
                        <span className="checkbox-custom-share">{year}</span>
                      </label>
                    ))}
                  </div>
                  <div className="action-buttons">
                    <button className="add-btn" onClick={handleCreateClick}>
                      <FaPlus /> Crear Cuota
                    </button>
                    <button className="back-btn" onClick={handleBack}>
                      Volver
                    </button>
                  </div>
                </div>
              </section>
              <section className="cuotas-table-section">
                {loadingCuotas ? (
                  <p className="no-data">Cargando cuotas...</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="cuotas-table">
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th>Monto</th>
                          <th>Método de Pago</th>
                          <th>Fecha de Pago</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length > 0 ? (
                          filteredData.map((cuota) => (
                            <tr key={cuota._id}>
                              <td>{formatMonth(cuota.date)}</td>
                              <td>
                                {new Intl.NumberFormat("es-CL", {
                                  style: "currency",
                                  currency: "CLP",
                                  minimumFractionDigits: 0,
                                }).format(cuota.amount)}
                              </td>
                              <td>{cuota.paymentmethod || "-"}</td>
                              <td>{cuota.paymentdate ? formatDate(cuota.paymentdate) : "-"}</td>
                              <td>{cuota.state}</td>
                              <td className="action-buttons">
                                <button
                                  className="action-btn-share-detail"
                                  onClick={() => handleEditClick(cuota)}
                                  title={cuota.paymentmethod && cuota.paymentdate ? "Editar" : "Pagar"}
                                  aria-label={cuota.paymentmethod && cuota.paymentdate ? "Editar cuota" : "Pagar cuota"}
                                >
                                  {cuota.paymentmethod && cuota.paymentdate ? <FaEdit /> : <FaMoneyBillWave />}
                                </button>
                                <button
                                  className="action-btn-share-detail"
                                  onClick={() => handleDelete(cuota._id)}
                                  title="Eliminar"
                                  aria-label="Eliminar cuota"
                                >
                                  <FaTrash />
                                </button>
                                <SendVoucherEmail
                                  student={selectedStudent}
                                  cuota={cuota}
                                  onSendingStart={() => handleSendingStart(cuota._id)}
                                  onSendingEnd={handleSendingEnd}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="no-data-row">
                              No hay cuotas registradas para el año seleccionado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              <ShareFormModal
                show={showModal}
                onHide={() => setShowModal(false)}
                selectedStudent={selectedStudent}
                selectedCuota={selectedCuota}
                availableMonths={availableMonths}
                months={months}
                onSave={handleSave}
                isEditing={isEditing}
                today={today}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareDetail;