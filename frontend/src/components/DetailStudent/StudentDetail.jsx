import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUsers, FaSearch, FaClipboardList, FaMoneyBill, FaChartBar, FaExchangeAlt, FaCalendarCheck, FaUserCog, FaCog, FaEnvelope, FaHome, FaArrowLeft, FaFileInvoice, FaSun, FaMoon, FaUserCircle, FaChevronDown, FaTimes as FaTimesClear } from 'react-icons/fa';
import { StudentsContext } from "../../context/student/StudentContext";
import { LoginContext } from "../../context/login/LoginContext";
import "./detailStudent.css";
import AppNavbar from '../navbar/AppNavbar';
import logo from '../../assets/logo.png';

const StudentDetail = () => {
  const { estudiantes } = useContext(StudentsContext);
  const { logout, userData } = useContext(LoginContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const profileRef = useRef(null);
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const menuItems = [
    { name: 'Inicio', route: '/', icon: <FaHome />, category: 'principal' },
    { name: 'Alumnos', route: '/student', icon: <FaUsers />, category: 'principal' },
    { name: 'Cuotas', route: '/share', icon: <FaMoneyBill />, category: 'finanzas' },
    { name: 'Reportes', route: '/report', icon: <FaChartBar />, category: 'informes' },
    { name: 'Movimientos', route: '/motion', icon: <FaExchangeAlt />, category: 'finanzas' },
    { name: 'Asistencia', route: '/attendance', icon: <FaCalendarCheck />, category: 'principal' },
    { name: 'Usuarios', route: '/user', icon: <FaUserCog />, category: 'configuracion' },
    { name: 'Ajustes', route: '/settings', icon: <FaCog />, category: 'configuracion' },
    { name: 'Envios de Mail', route: '/email-notifications', icon: <FaEnvelope />, category: 'comunicacion' },
    { name: 'Listado de Alumnos', route: '/liststudent', icon: <FaClipboardList />, category: 'informes' },
    { name: 'Volver Atrás', route: null, action: () => navigate(-1), icon: <FaArrowLeft />, category: 'navegacion' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const selectedStudent = estudiantes.find((est) => est._id === id);
    setStudent(selectedStudent);
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id, estudiantes]);

  if (!student) {
    return <div className="loading-text">Cargando...</div>;
  }

  const formatDate = (date) => {
    const adjustedDate = new Date(date);
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return adjustedDate.toLocaleDateString('es-ES', options);
  };

  const handleViewShares = () => {
    navigate(`/share/${student._id}`);
  };

  const handleViewPayments = () => {
    navigate(`/paymentstudent/${student._id}`);
  };

  const handleImageError = (e) => {
    setImageError(true);
    e.target.src = 'https://i.pinimg.com/736x/24/f2/25/24f22516ec47facdc2dc114f8c3de7db.jpg';
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={`app-container ${windowWidth <= 576 ? 'mobile-view' : ''}`}>
      {windowWidth <= 576 && (
        <AppNavbar
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      )}
      {windowWidth > 576 && (
        <header className="desktop-nav-header">
          <div className="nav-left-section"></div>
          <div className="header-logo-setting" onClick={() => navigate('/')}>
            <img src={logo} alt="Valladares Fútbol" className="logo-image" />
          </div>
          <div className="nav-right-section">
            <div
              className="profile-container"
              ref={profileRef}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <FaUserCircle className="profile-icon" />
              <span className="profile-greeting">
                Hola, {userData?.name || 'Usuario'}
              </span>
              <FaChevronDown className={`arrow-icon ${isProfileOpen ? 'rotated' : ''}`} />
              {isProfileOpen && (
                <div className="profile-menu">
                  <div
                    className="menu-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/user');
                      setIsProfileOpen(false);
                    }}
                  >
                    <FaUserCog className="option-icon" /> Mi Perfil
                  </div>
                  <div
                    className="menu-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/settings');
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
        <aside className={`sidebar ${isMenuOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <div className="sidebar-section">
              <button className="menu-toggle" onClick={toggleMenu}>
                {isMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
              <ul className="sidebar-menu">
                {menuItems.map((item, index) => (
                  <li
                    key={index}
                    className={`sidebar-menu-item ${item.route === '/student' ? 'active' : ''}`}
                    onClick={() => item.action ? item.action() : navigate(item.route)}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-text">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>
        <main className="main-content">
          <div className="perfil-container">
            <div className="perfil-header">
              <div className="perfil-avatar">
                <img
                  src={student.profileImage}
                  alt="Perfil"
                  onError={handleImageError}
                  className="avatar-img"
                />
              </div>
              <div className="perfil-info">
                <h2>{student.name} {student.lastName}</h2>
                <p className="perfil-status">Estado: <span className={`state-${student.state.toLowerCase()}`}>{student.state}</span></p>
                <div className="perfil-buttons">
                  <button className="action-btn-header" onClick={handleViewShares}>
                    Ver Cuotas
                  </button>
                  <button className="action-btn-header" onClick={handleViewPayments}>
                    Ver Pagos
                  </button>
                  <button className="action-btn-header" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Volver Atrás
                  </button>
                </div>
              </div>
            </div>
            <div className="perfil-details">
              <div className="details-section">
                <h3>Información Personal</h3>
                <div className="details-row">
                  <div className="form-group">
                    <label className="label-text">DNI</label>
                    <input type="text" value={student.dni || ''} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Fecha de Nacimiento</label>
                    <input type="text" value={formatDate(student.birthDate)} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Dirección</label>
                    <input type="text" value={student.address || ''} readOnly className="form-control-custom" />
                  </div>
                </div>
              </div>
              <div className="details-section">
                <h3>Información de Contacto</h3>
                <div className="details-row">
                  <div className="form-group">
                    <label className="label-text">Email</label>
                    <input type="text" value={student.mail || ''} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Nombre del Tutor</label>
                    <input type="text" value={student.guardianName || ''} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Teléfono del Tutor</label>
                    <input type="text" value={student.guardianPhone || ''} readOnly className="form-control-custom" />
                  </div>
                </div>
              </div>
              <div className="details-section">
                <h3>Información Médica</h3>
                <div className="details-row">
                  <div className="form-group">
                    <label className="label-text">Asmático</label>
                    <input type="text" value={student.isAsthmatic === undefined ? 'No especificado' : student.isAsthmatic ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Dolores de Cabeza</label>
                    <input type="text" value={student.hasHeadaches === undefined ? 'No especificado' : student.hasHeadaches ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Convulsiones</label>
                    <input type="text" value={student.hasSeizures === undefined ? 'No especificado' : student.hasSeizures ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Mareos</label>
                    <input type="text" value={student.hasDizziness === undefined ? 'No especificado' : student.hasDizziness ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Epilepsia</label>
                    <input type="text" value={student.hasEpilepsy === undefined ? 'No especificado' : student.hasEpilepsy ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Diabetes</label>
                    <input type="text" value={student.hasDiabetes === undefined ? 'No especificado' : student.hasDiabetes ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Alérgico</label>
                    <input type="text" value={student.isAllergic === undefined ? 'No especificado' : student.isAllergic ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                  </div>
                  {student.isAllergic && (
                    <div className="form-group">
                      <label className="label-text">Detalles de Alergias</label>
                      <input type="text" value={student.allergyDetails || ''} readOnly className="form-control-custom" />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="label-text">Toma Medicación</label>
                    <input type="text" value={student.takesMedication === undefined ? 'No especificado' : student.takesMedication ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                  </div>
                  {student.takesMedication && (
                    <div className="form-group">
                      <label className="label-text">Detalles de Medicación</label>
                      <input type="text" value={student.medicationDetails || ''} readOnly className="form-control-custom" />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="label-text">Otras Enfermedades</label>
                    <input type="text" value={student.otherDiseases || ''} readOnly className="form-control-custom" />
                  </div>
                  <div className="form-group">
                    <label className="label-text">Grupo Sanguíneo</label>
                    <input type="text" value={student.bloodType || ''} readOnly className="form-control-custom" />
                  </div>
                </div>
              </div>
              <div className="details-container">
                <div className="details-section">
                  <h3>Otros Datos</h3>
                  <div className="details-row">
                    <div className="form-group">
                      <label className="label-text">Categoría</label>
                      <input type="text" value={student.category || ''} readOnly className="form-control-custom" />
                    </div>
                    <div className="form-group">
                      <label className="label-text">Club</label>
                      <input type="text" value={student.club || ''} readOnly className="form-control-custom" />
                    </div>
                    <div className="form-group">
                      <label className="label-text">Descuento por Hermanos</label>
                      <input type="text" value={student.hasSiblingDiscount ? 'Sí' : 'No'} readOnly className="form-control-custom" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDetail;