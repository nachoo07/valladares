import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaUsers,
  FaBell,
  FaMoneyBill,
  FaChartBar,
  FaExchangeAlt,
  FaCalendarCheck,
  FaUserCog,
  FaCog,
  FaEnvelope,
  FaHome,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaSun,
  FaClipboardList,
  FaMoon,
  FaUserCircle,
  FaChevronDown,
  FaTimes as FaTimesClear,
} from "react-icons/fa";
import { StudentsContext } from "../../context/student/StudentContext";
import { PaymentContext } from "../../context/payment/PaymentContext";
import { LoginContext } from "../../context/login/LoginContext";
import Swal from "sweetalert2";
import SendPaymentVoucherEmail from "../voucherPayment/SendPaymentVoucerEmail";
import "./paymentStudent.css";
import AppNavbar from "../navbar/AppNavbar";
import logo from '../../assets/logo.png';

const PaymentStudent = () => {
  const { estudiantes } = useContext(StudentsContext);
  const { payments, loadingPayments, fetchPaymentsByStudent, createPayment, deletePayment, updatePayment, concepts, loadingConcepts, fetchConcepts, createConcept, deleteConcept } = useContext(PaymentContext);
  const { auth, logout, userData } = useContext(LoginContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [formData, setFormData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    concept: "",
    studentId: id,
  });
  const [editMode, setEditMode] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConceptModal, setShowConceptModal] = useState(false);
  const [newConcept, setNewConcept] = useState("");
  const hasFetched = useRef(false);

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
    { name: "Volver Atrás", route: null, action: () => navigate(-1), icon: <FaArrowLeft />, category: "navegacion" },
  ];

  useEffect(() => {
    const selectedStudent = estudiantes.find((est) => est._id === id);
    setStudent(selectedStudent);
  }, [id, estudiantes]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPaymentsByStudent(id);
      fetchConcepts();
    }
    return () => {
      hasFetched.current = false;
    };
  }, [id, fetchPaymentsByStudent, fetchConcepts]);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      if (newWidth <= 576) {
        setIsMenuOpen(false);
      } else {
        setIsMenuOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNewConceptChange = (e) => {
    setNewConcept(e.target.value);
  };

  const handleAddConcept = async (e) => {
    e.preventDefault();
    try {
      const normalizedConcept = newConcept.trim();
      if (!normalizedConcept) {
        Swal.fire("¡Error!", "El concepto no puede estar vacío.", "error");
        return;
      }
      await createConcept(normalizedConcept);
      Swal.fire("¡Éxito!", "Concepto creado correctamente.", "success");
      setNewConcept("");
      setShowConceptModal(false);
    } catch (error) {
      Swal.fire("¡Error!", error.response?.data?.message || "No se pudo crear el concepto.", "error");
    }
  };

  const handleDeleteConcept = async (conceptId, conceptName) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Eliminarás el concepto "${conceptName}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        await deleteConcept(conceptId);
        Swal.fire("¡Éxito!", "Concepto eliminado correctamente.", "success");
      } catch (error) {
        Swal.fire("¡Error!", error.response?.data?.message || "No se pudo eliminar el concepto.", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.concept) {
        Swal.fire("¡Error!", "Debe seleccionar un concepto.", "error");
        return;
      }
      const paymentData = {
        ...formData,
        paymentDate: new Date(formData.paymentDate).toISOString().split("T")[0],
      };
      if (editMode) {
        await updatePayment(editPaymentId, paymentData);
        Swal.fire("¡Éxito!", "El pago ha sido actualizado correctamente.", "success");
        setEditMode(false);
        setEditPaymentId(null);
      } else {
        await createPayment(paymentData);
        Swal.fire("¡Éxito!", "El pago ha sido registrado correctamente.", "success");
        await fetchPaymentsByStudent(id);
      }
      resetForm();
      setShowModal(false);
    } catch (error) {
      Swal.fire("¡Error!", error.response?.data?.message || (editMode ? "No se pudo actualizar el pago." : "No se pudo registrar el pago."), "error");
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      concept: "",
      studentId: id,
    });
    setEditMode(false);
    setEditPaymentId(null);
  };

  const handleEdit = (payment) => {
    setEditMode(true);
    setEditPaymentId(payment._id);
    setFormData({
      studentId: payment.studentId,
      amount: payment.amount,
      paymentDate: new Date(payment.paymentDate).toISOString().split("T")[0],
      paymentMethod: payment.paymentMethod,
      concept: payment.concept,
    });
    setShowModal(true);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleOpenConceptModal = () => {
    setNewConcept("");
    setShowConceptModal(true);
  };

  const handleCloseConceptModal = () => {
    setShowConceptModal(false);
    setNewConcept("");
  };

  const handleDelete = async (paymentId) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        await deletePayment(paymentId, id);
        Swal.fire("¡Éxito!", "El pago ha sido eliminado correctamente.", "success");
      } catch (error) {
        Swal.fire("¡Error!", error.response?.data?.message || "No se pudo eliminar el pago.", "error");
      }
    }
  };

const formatDate = (dateString) => {
  if (!dateString) return "-";
  
  try {
    // Formato ISO con el que trabajamos
    const isoDate = new Date(dateString).toISOString();
    const [fullDate] = isoDate.split('T');
    const [year, month, day] = fullDate.split('-');
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return dateString; // Devolver el original si hay un error
  }
};
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const today = new Date().toISOString().split("T")[0];

  if (!student) {
    return <div className="app-container">No se encontró el estudiante. Verifica el ID o los datos en StudentsContext.</div>;
  }

  return (
    <div className={`app-container ${windowWidth <= 576 ? "mobile-view" : ""}`}>
      {windowWidth <= 576 && (
        <AppNavbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      )}
      {windowWidth > 576 && (
        <header className="desktop-nav-header">
          <div className="nav-left-section"></div>
           <div className="header-logo-setting" onClick={() => navigate('/')}>
                      <img src={logo} alt="Valladares Fútbol" className="logo-image" />
                    </div>
          <div className="nav-right-section">
            <div className="profile-container" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              <FaUserCircle className="profile-icon" />
              <span className="profile-greeting">Hola, {userData?.name || "Usuario"}</span>
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
      <div className="dashboard-layout">
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
                    className={`sidebar-menu-item ${item.route === "/student" ? "active" : ""}`}
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
        <main className={`main-content ${!isMenuOpen ? "expanded" : ""}`}>
          <div className="content-columns">
            <div className="main-column">
              <section className="dashboard-welcome">
                <div className="welcome-text">
                  <h1>Pagos de {student.name} {student.lastName}</h1>
                </div>
              </section>
              {windowWidth > 576 && (
                <section className="search-section">
                  <div className="search-container">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Buscar pagos..."
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button className="search-clear" onClick={() => setSearchQuery("")}>
                        <FaTimesClear />
                      </button>
                    )}
                  </div>
                </section>
              )}
              <section className="payment-table-container">
                <h2 className="section-title">Historial de Pagos</h2>
                {loadingPayments ? (
                  <p>Cargando...</p>
                ) : payments.length === 0 ? (
                  <p className="no-data">No hay pagos registrados.</p>
                ) : (
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Fecha</th>
                        <th>Método</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments
                        .filter((payment) => payment.concept.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((payment, index) => (
                          <tr key={payment._id}>
                            <td>{index + 1}</td>
                            <td>{payment.concept.charAt(0).toUpperCase() + payment.concept.slice(1)}</td>
                            <td>${payment.amount.toLocaleString("es-ES")}</td>
                            <td>{formatDate(payment.paymentDate)}</td>
                            <td>{payment.paymentMethod}</td>
                            <td>
                              <div className="btn-action-container">
                                <button
                                  className="action-btn-student"
                                  onClick={() => handleEdit(payment)}
                                  aria-label="Editar pago"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="action-btn-student"
                                  onClick={() => handleDelete(payment._id)}
                                  aria-label="Eliminar pago"
                                >
                                  <FaTrash />
                                </button>
                                <SendPaymentVoucherEmail
                                  student={student}
                                  payment={payment}
                                  onSendingStart={() => {}}
                                  onSendingEnd={() => {}}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
            <div className="sidebar-column">
              <div className="dashboard-sidebar">
                <div className="quick-actions">
                  <div className="panel-header">
                    <h2 className="panel-title">Acciones Rápidas</h2>
                  </div>
                  <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={handleOpenModal}>
                      <FaPlus className="btn-icon" />
                      <span>Añadir Pago</span>
                    </button>
                    <button className="quick-action-btn" onClick={handleOpenConceptModal}>
                      <FaPlus className="btn-icon" />
                      <span>Crear Concepto</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate(-1)}>
                      <FaArrowLeft className="btn-icon" />
                      <span>Volver Atrás</span>
                    </button>
                  </div>
                </div>
                <div className="payment-summary">
                  <div className="panel-header">
                    <h2 className="panel-title">Resumen de Pagos</h2>
                  </div>
                  <div className="summary-content">
                    <p>
                      <strong>Total Pagado:</strong> ${totalPaid.toLocaleString("es-ES")}
                    </p>
                    <p>
                      <strong>Pagos Registrados:</strong> {payments.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="content-modal">
            <div className="modal-header-payment">
              <h2>{editMode ? "Editar Pago" : "Registrar Nuevo Pago"}</h2>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar modal"
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="payment-form">
                <div className="form-row full-width">
                  <label>Concepto</label>
                  <select name="concept" value={formData.concept} onChange={handleChange} required>
                    <option value="">Seleccionar concepto</option>
                    {concepts.map((concept) => (
                      <option key={concept._id} value={concept.name}>
                        {concept.name.charAt(0).toUpperCase() + concept.name.slice(1)}
                      </option>
                    ))}
                    {editMode &&
                      formData.concept &&
                      !concepts.some((c) => c.name === formData.concept) && (
                        <option value={formData.concept}>
                          {formData.concept.charAt(0).toUpperCase() + formData.concept.slice(1)}
                        </option>
                      )}
                  </select>
                </div>
                <div className="form-row">
                  <label>Monto</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Ingrese el monto"
                  />
                </div>
                <div className="form-row">
                  <label>Fecha de Pago</label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    required
                    max={today}
                  />
                </div>
                <div className="form-row">
                  <label>Método de Pago</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required>
                    <option value="">Seleccionar método</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-submit">
                    {editMode ? "Actualizar Pago" : "Guardar Pago"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showConceptModal && (
        <div className="modal-overlay">
          <div className="content-modal concept-modal">
            <div className="modal-header-concept">
              <h2>Gestionar Conceptos</h2>
              <button
                className="modal-close"
                onClick={handleCloseConceptModal}
                aria-label="Cerrar modal"
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <h3>Agregar Nuevo Concepto</h3>
              <form onSubmit={handleAddConcept} className="payment-form">
                <div className="form-row full-width">
                  <label>Nombre del Concepto</label>
                  <input
                    type="text"
                    value={newConcept}
                    onChange={handleNewConceptChange}
                    required
                    placeholder="Ej: Liga de Sierra Buena"
                    maxLength="50"
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-submit">
                    Guardar Concepto
                  </button>
                </div>
              </form>
              <h3 className="titulo-concepto">Conceptos Existentes</h3>
              {loadingConcepts ? (
                <p>Cargando conceptos...</p>
              ) : concepts.length === 0 ? (
                <p className="no-data">No hay conceptos registrados.</p>
              ) : (
                <div className="concept-list">
                  {concepts.map((concept) => (
                    <div key={concept._id} className="concept-item">
                      <span className="concept-name">
                        {concept.name.charAt(0).toUpperCase() + concept.name.slice(1)}
                      </span>
                      <button
                        className="concept-delete-btn"
                        onClick={() => handleDeleteConcept(concept._id, concept.name.charAt(0).toUpperCase() + concept.name.slice(1))}
                        aria-label={`Eliminar concepto ${concept.name}`}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseConceptModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStudent;