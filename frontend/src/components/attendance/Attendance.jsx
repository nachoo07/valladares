import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceContext } from "../../context/attendance/AttendanceContext";
import { StudentsContext } from "../../context/student/StudentContext";
import { LoginContext } from '../../context/login/LoginContext';
import {
  FaBars, FaUsers, FaMoneyBill, FaChartBar, FaExchangeAlt, FaList,
  FaCalendarCheck, FaUserCog, FaCog, FaEnvelope, FaHome, FaArrowLeft,
  FaUserCircle, FaChevronDown, FaTimes, FaClipboardList, FaSearch, FaTimes as FaTimesClear,
  FaFileExport
} from 'react-icons/fa';
import DatePicker from "react-datepicker";
import { format, isValid, eachDayOfInterval, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { Modal, Button, Form } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import './attendance.css';
import AppNavbar from '../navbar/AppNavbar';
import logo from '../../assets/logo.png';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { es } from 'date-fns/locale';

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(startOfMonth(new Date()));
  const [reportEndDate, setReportEndDate] = useState(endOfMonth(new Date()));
  const [reportFormat, setReportFormat] = useState('excel');
  const [reportError, setReportError] = useState(null);
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');
  const profileRef = useRef(null);
  const modalRef = useRef(null);
  const { estudiantes } = useContext(StudentsContext);
  const { auth, logout, userData } = useContext(LoginContext);
  const { agregarAsistencia, actualizarAsistencia, ObtenerAsistencia, asistencias } = useContext(AttendanceContext);

  // Definir categorías agrupadas por club con turnos
  const categoryGroups = {
    Valladares: [
      { label: '2013-2014 (Turno A)', years: ['2013', '2014'], turno: 'A' },
      { label: '2015-2016 (Turno A)', years: ['2015', '2016'], turno: 'A' },
      { label: '2015-2016 (Turno B)', years: ['2015', '2016'], turno: 'B' },
      { label: '2017-2018 (Turno A)', years: ['2017', '2018'], turno: 'A' },
      { label: '2017-2018 (Turno B)', years: ['2017', '2018'], turno: 'B' },
      { label: '2019-2020-2021 (Turno A)', years: ['2019', '2020', '2021'], turno: 'A' },
      { label: '2019-2020-2021 (Turno B)', years: ['2019', '2020', '2021'], turno: 'B' },
    ],
    'El Palmar': [
      { label: '2010-2011-2012 (Turno B)', years: ['2010', '2011', '2012'], turno: 'B' },
      { label: '2017-2018 (Turno B)', years: ['2017', '2018'], turno: 'B' },
      { label: '2016 (Turno B)', years: ['2016'], turno: 'B' },
      { label: '2015 (Turno B)', years: ['2015'], turno: 'B' },
      { label: '2011-2012 (Turno A)', years: ['2011', '2012'], turno: 'A' },
      { label: '2013 (Turno A)', years: ['2013'], turno: 'A' },
      { label: '2014 (Turno A)', years: ['2014'], turno: 'A' },
    ],
  };

  const clubs = ['Valladares', 'El Palmar'];

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
    { name: 'Lista de Movimientos', route: '/listeconomic', icon: <FaList />, category: 'finanzas' }
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
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsReportModalOpen(false);
        setReportError(null);
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
      const selectedGroup = categoryGroups[selectedClub].find(group => group.label === selectedCategory);
      const filteredByClubAndCategory = studentsArray.filter(student => {
        const matchesClub = student.club === selectedClub;
        const matchesCategory = selectedGroup.years.includes(student.category);
        const matchesTurno = student.turno === selectedGroup.turno || (!student.turno && selectedGroup.turno === '');
        return matchesClub && matchesCategory && matchesTurno;
      });
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
      const selectedGroup = categoryGroups[selectedClub].find(group => group.label === selectedCategory);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const asistenciaExistente = asistencias.find(asistencia => {
        const asistenciaDate = new Date(asistencia.date);
        const formattedAsistenciaDate = isValid(asistenciaDate) ? format(asistenciaDate, 'yyyy-MM-dd') : null;
        if (!formattedAsistenciaDate) return false;
        // Verificar que attendance sea un array antes de mapear
        const studentIds = Array.isArray(asistencia.attendance)
          ? asistencia.attendance.map(a => a.idStudent)
          : [];
        const relevantStudents = estudiantes.filter(student =>
          studentIds.includes(student._id) &&
          student.club === selectedClub &&
          selectedGroup.years.includes(student.category) &&
          (student.turno === selectedGroup.turno || (!student.turno && selectedGroup.turno === ''))
        );
        return formattedAsistenciaDate === formattedDate && relevantStudents.length > 0;
      });
      if (asistenciaExistente) {
        const newAttendance = {};
        // Verificar que attendance sea un array antes de iterar
        if (Array.isArray(asistenciaExistente.attendance)) {
          asistenciaExistente.attendance.forEach(student => {
            newAttendance[student.idStudent] = student.present ? 'present' : 'absent';
          });
        } else {
          console.warn('asistencia.attendance no es un array para la fecha:', formattedDate);
        }
        setAttendance(newAttendance);
        setIsAttendanceSaved(true);
      } else {
        setAttendance({});
        setIsAttendanceSaved(false);
      }
    }
  }, [selectedClub, selectedCategory, selectedDate, asistencias, estudiantes]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prevState => ({
      ...prevState,
      [studentId]: status
    }));
  };

  const handleAttendanceSubmit = async () => {
    if (!filteredStudents.length) {
      alert('No hay estudiantes seleccionados para registrar la asistencia.');
      return;
    }
    if (!selectedDate || isNaN(new Date(selectedDate).getTime())) {
      alert('Por favor, selecciona una fecha válida.');
      return;
    }
    if (!selectedCategory) {
      alert('Por favor, selecciona una categoría.');
      return;
    }
    const validStudents = filteredStudents.filter(
      student => student._id && typeof student._id === 'string' && student.name && student.lastName
    );
    if (!validStudents.length) {
      alert('No hay estudiantes con datos completos para registrar la asistencia.');
      return;
    }

    // Validar que todos los estudiantes tengan un estado (presente o ausente)
    const incompleteStudents = validStudents.filter(student => {
      const status = attendance[student._id];
      return !status || (status !== 'present' && status !== 'absent');
    });

    if (incompleteStudents.length > 0) {
      alert('Es necesario seleccionar el estado (presente o ausente) para todos los estudiantes.');
      return;
    }

    const attendanceData = {
      date: new Date(selectedDate).toISOString(),
      category: selectedCategory,
      attendance: validStudents.map(student => ({
        idStudent: student._id,
        name: student.name,
        lastName: student.lastName,
        present: attendance[student._id] === 'present'
      }))
    };

    try {
      if (isAttendanceSaved) {
        await actualizarAsistencia(attendanceData);
      } else {
        await agregarAsistencia(attendanceData);
      }
      ObtenerAsistencia();
      setIsAttendanceSaved(true);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al guardar la asistencia:', error);
      alert('Ocurrió un error al guardar la asistencia. Por favor, intenta de nuevo.');
    }
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

  const generateReport = () => {
    setReportError(null);

    if (!selectedClub || !selectedCategory) {
      setReportError('Por favor, selecciona un club y una categoría.');
      return;
    }

    if (!reportStartDate || !reportEndDate || reportStartDate > reportEndDate) {
      setReportError('Por favor, selecciona un rango de fechas válido.');
      return;
    }

    const selectedGroup = categoryGroups[selectedClub].find(group => group.label === selectedCategory);
    const startUTC = startOfDay(reportStartDate);
    const endUTC = endOfDay(reportEndDate);
    const dateRange = eachDayOfInterval({ start: startUTC, end: endUTC });

    // Obtener todas las fechas únicas con asistencia
    const attendanceDates = [...new Set(asistencias
      .filter(asistencia => {
        const asistenciaDate = new Date(asistencia.date);
        return isValid(asistenciaDate) && asistenciaDate >= startUTC && asistenciaDate <= endUTC;
      })
      .map(asistencia => format(new Date(asistencia.date), 'dd/MM'))
    )];

    if (attendanceDates.length === 0) {
      setReportError('No hay datos de asistencia para el rango de fechas seleccionadas.');
      return;
    }

    const reportData = [];
    const studentsWithAttendance = {};

    // Recolectar datos de asistencia por estudiante
    asistencias.forEach(asistencia => {
      const asistenciaDate = new Date(asistencia.date);
      if (isValid(asistenciaDate) && asistenciaDate >= startUTC && asistenciaDate <= endUTC) {
        asistencia.attendance.forEach(studentAttendance => {
          const student = estudiantes.find(st => st._id === studentAttendance.idStudent);
          if (student && student.club === selectedClub && selectedGroup.years.includes(student.category) && (student.turno === selectedGroup.turno || (!student.turno && selectedGroup.turno === ''))) {
            const studentId = student._id;
            if (!studentsWithAttendance[studentId]) {
              studentsWithAttendance[studentId] = {
                name: student.name,
                lastName: student.lastName,
                category: selectedCategory
              };
            }
            const dateKey = format(asistenciaDate, 'dd/MM');
            studentsWithAttendance[studentId][dateKey] = studentAttendance.present ? 'P' : 'A';
          }
        });
      }
    });

    // Convertir datos a formato de reporte
    Object.values(studentsWithAttendance).forEach(studentData => {
      const row = {
        'Nombre completo': `${studentData.name} ${studentData.lastName}`,
        Categoría: studentData.category
      };
      attendanceDates.forEach(date => {
        row[date] = studentData[date] || ''; // 'P' o 'A' si existe, vacío si no
      });
      reportData.push(row);
    });

    if (reportData.length === 0) {
      setReportError('No hay datos de asistencia para el rango de fechas seleccionadas.');
      return;
    }

    if (reportFormat === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');
      XLSX.writeFile(workbook, `Reporte_Asistencia_${selectedClub}_${selectedCategory}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } else if (reportFormat === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Reporte de Asistencia - ${selectedClub}`, 20, 10);
      doc.setFontSize(12);
      doc.text(`Categoría: ${selectedCategory}`, 20, 20);
      doc.text(`Rango: ${format(reportStartDate, 'dd/MM/yyyy')} - ${format(reportEndDate, 'dd/MM/yyyy')}`, 20, 30);

      const headers = ['Nombre completo', 'Categoría', ...attendanceDates];
      const data = reportData.map(row => [
        row['Nombre completo'],
        row['Categoría'],
        ...attendanceDates.map(date => row[date] || '')
      ]);

      autoTable(doc, { // Cambia doc.autoTable por autoTable(doc,
        head: [headers],
        body: data,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [4, 164, 92] }
      });

      doc.save(`Reporte_Asistencia_${selectedClub}_${selectedCategory}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    }

    setIsReportModalOpen(false);
    setReportError(null);
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
              <h3>Seleccione una categoría:</h3>
              <section className="attendance-categories">
                {categoryGroups[selectedClub].map(group => (
                  <button
                    key={group.label}
                    className={`category-btn ${selectedCategory === group.label ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(group.label)}
                  >
                    {group.label}
                  </button>
                ))}
              </section>
            </>
          )}


          {selectedClub && selectedCategory && (
            <>
              <div className="attendance-header">
                <div className="attendance-date-picker">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    maxDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    className="attendance-date-input"
                    locale={es}
                    dropdownMode="select"
                  />
                </div>
                <div className="attendance-search-container">
                  <button className="attendance-today-btn" onClick={() => setSelectedDate(new Date())}>
                    Hoy
                  </button>
                  <button
                    className="attendance-report-btn"
                    onClick={() => setIsReportModalOpen(true)}
                    title="Generar reporte de asistencia"
                  >
                    <FaFileExport /> <span className="report-text">Generar Reporte</span>
                  </button>
                </div>
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
                            className={isAttendanceSaved && !isEditing ? 'disabled-checkbox' : 'activated-checkbox'}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={attendance[student._id] === 'absent'}
                            onChange={() => handleAttendanceChange(student._id, 'absent')}
                            disabled={isAttendanceSaved && !isEditing}
                            className={isAttendanceSaved && !isEditing ? 'disabled-checkbox' : 'activated-checkbox'}
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
          <Modal show={isReportModalOpen} onHide={() => { setIsReportModalOpen(false); setReportError(null); }} centered>
            <Modal.Header closeButton className="modal-header-attendance">
              <Modal.Title>Generar Reporte de Asistencia</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-body-attendance">
              {reportError && <div className="alert alert-danger">{reportError}</div>}
              <Form>
                <Form.Group controlId="reportStartDate" className="mb-3">
                  <Form.Label>Fecha Inicial:</Form.Label>
                  <DatePicker
                    selected={reportStartDate}
                    onChange={(date) => setReportStartDate(date)}
                    maxDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    locale={es}
                    dropdownMode="select"
                  />
                </Form.Group>
                <Form.Group controlId="reportEndDate" className="mb-3">
                  <Form.Label>Fecha Final:</Form.Label>
                  <DatePicker
                    selected={reportEndDate}
                    onChange={(date) => setReportEndDate(date)}
                    maxDate={new Date()}
                    minDate={reportStartDate}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    locale={es}
                    dropdownMode="select"
                  />
                </Form.Group>
                <Form.Group controlId="reportFormat" className="mb-3">
                  <Form.Label>Formato:</Form.Label>
                  <Form.Select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer className="modal-footer-attendance">
              <Button className="btn-modal-cancelar" onClick={() => { setIsReportModalOpen(false); setReportError(null); }}>
                Cancelar
              </Button>
              <Button className="btn-modal-guardar" onClick={generateReport}>
                Generar
              </Button>
            </Modal.Footer>
          </Modal>
        </main>
      </div>
    </div>
  );
};

export default Attendance;