import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceContext } from "../../context/attendance/AttendanceContext";
import { StudentsContext } from "../../context/student/StudentContext";
import { LoginContext } from '../../context/login/LoginContext';
import {
  FaBars, FaUsers, FaMoneyBill, FaChartBar, FaExchangeAlt,
  FaCalendarCheck, FaUserCog, FaCog, FaEnvelope, FaHome, FaArrowLeft,
  FaUserCircle, FaChevronDown, FaTimes, FaClipboardList, FaSearch, FaTimes as FaTimesClear
} from 'react-icons/fa';
import DatePicker from "react-datepicker";
import { format, isValid } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import './attendance.css';
import AppNavbar from '../navbar/AppNavbar';
import logo from '../../assets/logo.png';

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');
  const profileRef = useRef(null);
  const { estudiantes } = useContext(StudentsContext);
  const { auth, logout, userData } = useContext(LoginContext);
  const { agregarAsistencia, actualizarAsistencia, ObtenerAsistencia, asistencias } = useContext(AttendanceContext);
  const categories = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
  const clubs = ["Valladares", "El Palmar"];

  const fullMenuItems = [
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
    { name: 'Volver Atrás', route: null, action: () => navigate(-1), icon: <FaArrowLeft />, category: 'navegacion' },
  ];

  const userMenuItems = fullMenuItems.filter(item =>
    ['Inicio', 'Asistencia'].includes(item.name)
  );

  const menuItems = auth === 'admin' ? fullMenuItems : userMenuItems;

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
  }, []);

  useEffect(() => {
    if (selectedClub && selectedCategory) {
      const studentsArray = Array.isArray(estudiantes) ? estudiantes : [];
      const filteredByClubAndCategory = studentsArray.filter(student =>
        student.club === selectedClub && student.category === selectedCategory
      );
      const filteredBySearch = filteredByClubAndCategory.filter(student => {
        const searchNormalized = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const nameNormalized = student.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const lastNameNormalized = student.lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fullName = `${nameNormalized} ${lastNameNormalized}`;
        return fullName.includes(searchNormalized);
      });
      setFilteredStudents(filteredBySearch);
    } else {
      setFilteredStudents([]);
    }
  }, [selectedClub, selectedCategory, estudiantes, searchTerm]);

  useEffect(() => {
    if (selectedClub && selectedCategory && selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const asistenciaExistente = asistencias.find(
        (asistencia) => {
          const asistenciaDate = new Date(asistencia.date);
          return isValid(asistenciaDate) && format(asistenciaDate, 'yyyy-MM-dd') === formattedDate && asistencia.category === selectedCategory;
        }
      );
      if (asistenciaExistente) {
        const newAttendance = {};
        if (Array.isArray(asistenciaExistente.attendance)) {
          asistenciaExistente.attendance.forEach(student => {
            newAttendance[student.idStudent] = student.present ? 'present' : 'absent';
          });
        } else {
          try {
            const attendanceData = typeof asistenciaExistente.attendance === 'string'
              ? JSON.parse(asistenciaExistente.attendance)
              : asistenciaExistente.attendance;
            if (Array.isArray(attendanceData)) {
              attendanceData.forEach(student => {
                newAttendance[student.idStudent] = student.present ? 'present' : 'absent';
              });
            } else if (typeof attendanceData === 'object') {
              Object.keys(attendanceData).forEach(studentId => {
                newAttendance[studentId] = attendanceData[studentId].present ? 'present' : 'absent';
              });
            }
          } catch (error) {
            console.error("Error procesando datos de asistencia:", error);
          }
        }
        setAttendance(newAttendance);
        setIsAttendanceSaved(true);
      } else {
        setAttendance({});
        setIsAttendanceSaved(false);
      }
    }
  }, [selectedClub, selectedCategory, selectedDate, asistencias]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prevState => ({
      ...prevState,
      [studentId]: status
    }));
  };

  const handleAttendanceSubmit = async () => {
    const attendanceData = {
      date: new Date(selectedDate.getTime()).toISOString(),
      category: selectedCategory,
      club: selectedClub,
      attendance: filteredStudents.map(student => ({
        idStudent: student._id,
        present: attendance[student._id] === 'present',
        name: student.name,
        lastName: student.lastName
      }))
    };
    if (isAttendanceSaved) {
      await actualizarAsistencia(attendanceData);
    } else {
      await agregarAsistencia(attendanceData);
    }
    ObtenerAsistencia();
    setIsAttendanceSaved(true);
    setIsEditing(false);
  };

  const handleEditAttendance = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleLogout = async () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
                    className={`sidebar-menu-item ${item.route === '/attendance' ? 'active' : ''}`}
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
          <section className="dashboard-welcome">
            <div className="welcome-text-attendance">
              <h1>Registro de Asistencia</h1>
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
          {!selectedClub && (
            <section className="attendance-clubs">
              <h2 className="attendance-titulo-club">Seleccione un Club</h2>
              {clubs.map(club => (
                <button
                  key={club}
                  className="club-btn"
                  onClick={() => setSelectedClub(club)}
                >
                  {club}
                </button>
              ))}
            </section>
          )}
          {selectedClub && (
            <>
              <section className="attendance-clubs">
                <h2>Club Seleccionado: {selectedClub}</h2>
                <button
                  className="club-btn change-club-btn"
                  onClick={() => {
                    setSelectedClub(null);
                    setSelectedCategory(null);
                    setFilteredStudents([]);
                    setAttendance({});
                    setIsAttendanceSaved(false);
                    setIsEditing(false);
                  }}
                >
                  Cambiar Club
                </button>
              </section>
              <h3>Seleccione una categoria:</h3>
              <section className="attendance-categories">

                {categories.map(category => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </section>
            </>
          )}
          {selectedClub && selectedCategory && (
            <>
              <div className="attendance-date-picker">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  maxDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                  className="attendance-date-input"
                />
                <button className="attendance-today-btn" onClick={() => setSelectedDate(new Date())}>
                  Hoy
                </button>
              </div>
              {filteredStudents.length > 0 ? (
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Nombre y Apellido</th>
                      <th>Presente</th>
                      <th>Ausente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student._id}>
                        <td>{student.name} {student.lastName}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={attendance[student._id] === 'present'}
                            onChange={() => handleAttendanceChange(student._id, 'present')}
                            disabled={isAttendanceSaved && !isEditing}
                            className={isAttendanceSaved && !isEditing ? 'disabled-checkbox' : ''}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={attendance[student._id] === 'absent'}
                            onChange={() => handleAttendanceChange(student._id, 'absent')}
                            disabled={isAttendanceSaved && !isEditing}
                            className={isAttendanceSaved && !isEditing ? 'disabled-checkbox' : ''}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-students-message">
                  <p>No hay alumnos registrados en esta categoría para {selectedClub}</p>
                </div>
              )}
              {filteredStudents.length > 0 && (
                <div className="attendance-buttons">
                  {!isAttendanceSaved && (
                    <button className="attendance-save-btn" onClick={handleAttendanceSubmit}>
                      Guardar Asistencia
                    </button>
                  )}
                  {isAttendanceSaved && !isEditing && (
                    <button className="attendance-edit-btn" onClick={handleEditAttendance}>
                      Editar Asistencia
                    </button>
                  )}
                  {isEditing && (
                    <>
                      <button className="attendance-update-btn" onClick={handleAttendanceSubmit}>
                        Actualizar Asistencia
                      </button>
                      <button className="attendance-cancel-btn" onClick={handleCancelEdit}>
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Attendance;