import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaBars, FaTimes, FaUsers,FaClipboardList, FaMoneyBill, FaChartBar, FaExchangeAlt, FaCalendarCheck,
  FaUserCog, FaCog, FaEnvelope, FaHome, FaArrowLeft, FaUserCircle, FaChevronDown, FaPlus,
  FaEdit, FaTrash, FaTimes as FaTimesClear
} from 'react-icons/fa';
import { StudentsContext } from '../../context/student/StudentContext';
import { LoginContext } from '../../context/login/LoginContext';
import StudentFormModal from '../modal/StudentFormModal';
import Swal from 'sweetalert2';
import './student.css';
import AppNavbar from '../navbar/AppNavbar';
import logo from '../../assets/logo.png';

const Student = () => {
  const navigate = useNavigate();
  const { estudiantes, obtenerEstudiantes, addEstudiante, updateEstudiante, deleteEstudiante } = useContext(StudentsContext);
  const { auth, logout, userData } = useContext(LoginContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [show, setShow] = useState(false);
  const profileRef = useRef(null);
  const [editStudent, setEditStudent] = useState(null);
  const [filterState, setFilterState] = useState('todos');
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    dni: '',
    birthDate: '',
    address: '',
    mail: '',
    category: '',
    guardianName: '',
    guardianPhone: '',
    profileImage: null,
    state: 'Activo',
    hasSiblingDiscount: false,
    isAsthmatic: undefined,
    hasHeadaches: undefined,
    hasSeizures: undefined,
    hasDizziness: undefined,
    hasEpilepsy: undefined,
    hasDiabetes: undefined,
    isAllergic: undefined,
    allergyDetails: '',
    takesMedication: undefined,
    medicationDetails: '',
    otherDiseases: '',
    bloodType: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const studentsPerPage = 10;

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
    { name: 'Listado de Alumnos', route: '/liststudent', icon: <FaClipboardList  />, category: 'informes' },
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
    obtenerEstudiantes();

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
    return () => window.addEventListener('resize', handleResize);
  }, []);

  const filteredStudents = estudiantes.filter((estudiante) => {
    const searchNormalized = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const nameNormalized = estudiante.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const lastNameNormalized = estudiante.lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const fullName = `${nameNormalized} ${lastNameNormalized}`;
    const dniSearch = estudiante.dni?.toLowerCase().includes(searchNormalized);

    const matchesSearch = fullName.includes(searchNormalized) || dniSearch;
    const matchesState =
      filterState === 'todos' ||
      (filterState === 'activo' && estudiante.state === 'Activo') ||
      (filterState === 'inactivo' && estudiante.state === 'Inactivo');

    return matchesSearch && matchesState;
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleShow = (student = null) => {
    if (student) {
      setEditStudent(student);
      setFormData({
        ...student,
        birthDate: new Date(student.birthDate).toISOString().split('T')[0],
        profileImage: student.profileImage,
        hasSiblingDiscount: student.hasSiblingDiscount || false,
        isAsthmatic: student.isAsthmatic,
        hasHeadaches: student.hasHeadaches,
        hasSeizures: student.hasSeizures,
        hasDizziness: student.hasDizziness,
        hasEpilepsy: student.hasEpilepsy,
        hasDiabetes: student.hasDiabetes,
        isAllergic: student.isAllergic,
        allergyDetails: student.allergyDetails || '',
        takesMedication: student.takesMedication,
        medicationDetails: student.medicationDetails || '',
        otherDiseases: student.otherDiseases || '',
        bloodType: student.bloodType || ''
      });
    } else {
      setEditStudent(null);
      setFormData({
        name: '',
        lastName: '',
        dni: '',
        birthDate: '',
        address: '',
        mail: '',
        category: '',
        guardianName: '',
        guardianPhone: '',
        profileImage: null,
        state: 'Activo',
        hasSiblingDiscount: false,
        isAsthmatic: undefined,
        hasHeadaches: undefined,
        hasSeizures: undefined,
        hasDizziness: undefined,
        hasEpilepsy: undefined,
        hasDiabetes: undefined,
        isAllergic: undefined,
        allergyDetails: '',
        takesMedication: undefined,
        medicationDetails: '',
        otherDiseases: '',
        bloodType: ''
      });
    }
    setShow(true);
  };

  const handleClose = () => setShow(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dni) {
      setAlertMessage("El DNI es obligatorio");
      setShowAlert(true);
      return;
    }
    if (editStudent) {
      await updateEstudiante(formData);
      Swal.fire("¡Éxito!", "El perfil ha sido actualizado.", "success");
    } else {
      await addEstudiante(formData);
      Swal.fire("¡Éxito!", "El alumno ha sido agregado.", "success");
    }
    setShow(false);
  };

  const handleDelete = async (studentId) => {
    try {
      await deleteEstudiante(studentId);
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema al eliminar el alumno.', 'error');
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleFilterChange = (e) => {
    const { name, checked } = e.target;
    if (checked) {
      setFilterState(name);
    }
  };

  return (
    <div className={`app-container ${windowWidth <= 576 ? 'mobile-view' : ''}`}>
      {windowWidth <= 576 && (
        <AppNavbar
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
        />
      )}
      {windowWidth > 576 && (
        <header className="desktop-nav-header">
          <div className="nav-left-section"></div>
            <div className="header-logo" onClick={() => navigate('/')}>
                        <img src={logo} alt="Valladares Fútbol" className="logo-image" />
                      </div>
          <div className="search-box">
            <FaSearch className="search-symbol" />
            <input
              type="text"
              placeholder="Buscar alumnos..."
              className="search-field"
              value={searchTerm}
              onChange={handleSearchChange}
            />
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
        <main className={`main-content`}>
          <section className="dashboard-welcome">
            <div className="welcome-text">
              <h1>Panel de Alumnos</h1>
            </div>
          </section>
          {windowWidth <= 576 && (
            <section className="mobile-search-section">
              <div className="mobile-search-container">
                <FaSearch className="mobile-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar alumnos..."
                  className="mobile-search-input"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    className="mobile-search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    <FaTimesClear />
                  </button>
                )}
              </div>
            </section>
          )}
          <section className="students-filter">
            <div className="filter-actions">
              <div className="checkbox-filters">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="todos"
                    checked={filterState === 'todos'}
                    onChange={handleFilterChange}
                  />
                  <span className="checkbox-custom">Todos</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={filterState === 'activo'}
                    onChange={handleFilterChange}
                  />
                  <span className="checkbox-custom">Activo</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="inactivo"
                    checked={filterState === 'inactivo'}
                    onChange={handleFilterChange}
                  />
                  <span className="checkbox-custom">Inactivo</span>
                </label>
              </div>
              <button className="add-btn" onClick={() => handleShow()}>
                <FaPlus /> Agregar Alumno
              </button>
            </div>
          </section>
          <section className="students-table-section">
            {showAlert && (
              <div className="custom-alert">
                <div className="alert-content">
                  <h4>¡Atención!</h4>
                  <p>{alertMessage}</p>
                  <button onClick={() => setShowAlert(false)}>Cerrar</button>
                </div>
              </div>
            )}
            <div className="table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>DNI</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length > 0 ? (
                    currentStudents.map((estudiante, index) => (
                      <tr key={estudiante._id} className={`state-${estudiante.state.toLowerCase()}`}>
                        <td>{indexOfFirstStudent + index + 1}</td>
                        <td>{estudiante.name}</td>
                        <td>{estudiante.lastName}</td>
                        <td>{estudiante.dni}</td>
                        <td>{estudiante.state}</td>
                        <td className="action-buttons">
                          <button
                            className="action-btn-student"
                            onClick={() => navigate(`/detailstudent/${estudiante._id}`)}
                            title="Ver Detalle"
                          >
                            <FaUserCircle />
                          </button>
                          <button
                            className="action-btn-student"
                            onClick={() => handleShow(estudiante)}
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn-student"
                            onClick={() => handleDelete(estudiante._id)}
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="empty-table-row">
                      <td colSpan="6" className="empty-table-message">
                        {searchTerm ? (
                          `No se encontraron alumnos que coincidan con "${searchTerm}"`
                        ) : filterState !== 'todos' ? (
                          `No hay alumnos con estado "${filterState}"`
                        ) : (
                          "No hay alumnos registrados en el sistema"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => paginate(currentPage - 1)}
                className="pagination-btn"
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                  onClick={() => paginate(number)}
                >
                  {number}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => paginate(currentPage + 1)}
                className="pagination-btn"
              >
                »
              </button>
            </div>
          </section>
          <StudentFormModal
            show={show}
            handleClose={handleClose}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            formData={formData}
          />
        </main>
      </div>
    </div>
  );
};

export default Student;