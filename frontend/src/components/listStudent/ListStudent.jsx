import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaDownload, FaFilePdf, FaBars, FaTimes, FaClipboardList, FaUserCircle, FaChevronDown, FaHome, FaUsers, FaMoneyBill, FaChartBar, FaExchangeAlt, FaCalendarCheck, FaUserCog, FaCog, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { StudentsContext } from '../../context/student/StudentContext';
import { PaymentContext } from '../../context/payment/PaymentContext';
import { LoginContext } from '../../context/login/LoginContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AppNavbar from '../navbar/AppNavbar';
import './listStudent.css';
import logo from '../../assets/logo.png';

const ListStudent = () => {
  const navigate = useNavigate();
  const { estudiantes } = useContext(StudentsContext);
  const { payments, concepts, fetchConcepts } = useContext(PaymentContext);
  const { auth, logout, userData } = useContext(LoginContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [clubFilter, setClubFilter] = useState(''); // Nuevo estado para el filtro de club
  const [conceptFilter, setConceptFilter] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const profileRef = useRef(null);

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
    fetchConcepts();
  }, [fetchConcepts]);

  useEffect(() => {
    const filterStudents = () => {
      let filtered = [...estudiantes];

      // Filtro por búsqueda (nombre, apellido o DNI)
      if (searchTerm) {
        const searchNormalized = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        filtered = filtered.filter((student) => {
          const nameNormalized = student.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const lastNameNormalized = student.lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const fullName = `${nameNormalized} ${lastNameNormalized}`;
          const dniSearch = student.dni?.toLowerCase().includes(searchNormalized);
          return fullName.includes(searchNormalized) || dniSearch;
        });
      }

      // Filtro por categoría (año de nacimiento)
      if (categoryFilter) {
        filtered = filtered.filter((student) => {
          const birthYear = new Date(student.birthDate).getFullYear();
          return birthYear === parseInt(categoryFilter);
        });
      }

      // Nuevo filtro por club
      if (clubFilter) {
        filtered = filtered.filter((student) => student.club === clubFilter);
      }

      setFilteredStudents(filtered);
    };

    filterStudents();
  }, [searchTerm, categoryFilter, clubFilter, estudiantes]); // Añadimos clubFilter como dependencia

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getPaymentByConcept = (studentId, concept) => {
    const studentPayments = payments.filter((payment) => payment.studentId === studentId);
    return studentPayments.find((payment) => payment.concept === concept) || null;
  };

  const handleDownloadExcel = () => {
    const excelData = filteredStudents.map((student) => {
      const payment = conceptFilter ? getPaymentByConcept(student._id, conceptFilter) : null;
      return {
        'Nombre Completo': `${student.name} ${student.lastName}`,
        DNI: student.dni,
        'Fecha de Nacimiento': formatDate(student.birthDate),
        Club: student.club || 'N/A', // Añadimos el campo club
        ...(conceptFilter && {
          Concepto: conceptFilter,
          Monto: payment ? `$${payment.amount.toLocaleString('es-ES')}` : 'Pendiente',
        }),
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos_Pagos');
    XLSX.writeFile(workbook, 'Lista_Alumnos_Pagos.xlsx');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Lista de Alumnos', 14, 20);

    const tableData = filteredStudents.map((student, index) => {
      const payment = conceptFilter ? getPaymentByConcept(student._id, conceptFilter) : null;
      return [
        index + 1,
        `${student.name} ${student.lastName}`,
        student.dni,
        formatDate(student.birthDate),
        student.club || 'N/A', // Añadimos el campo club
        ...(conceptFilter ? [conceptFilter, payment ? `$${payment.amount.toLocaleString('es-ES')}` : 'Pendiente'] : []),
      ];
    });

    const headers = ['#', 'Nombre Completo', 'DNI', 'Fecha de Nacimiento', 'Club', ...(conceptFilter ? ['Concepto', 'Monto'] : [])];
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 30,
      margin: { top: 20 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [4, 164, 92] },
    });

    doc.save('Lista_Alumnos_Pagos.pdf');
  };

  const handleLogout = async () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  // Obtener años de nacimiento únicos para el filtro de categoría
  const uniqueBirthYears = [...new Set(estudiantes.map(student => new Date(student.birthDate).getFullYear()).sort((a, b) => b - a))];

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
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
              <ul className="sidebar-menu">
                {menuItems.map((item, index) => (
                  <li
                    key={index}
                    className={`sidebar-menu-item ${item.route === '/liststudent' ? 'active' : ''}`}
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
            <div className="welcome-text">
              <h1>Lista de Alumnos con Pagos</h1>
            </div>
          </section>
          <section className="students-filter">
            <div className="filter-actions">
              <div className="category-filters">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Seleccionar Categoría</option>
                  {uniqueBirthYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="concept-filters">
                <select
                  value={conceptFilter}
                  onChange={(e) => setConceptFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Seleccionar Concepto</option>
                  {concepts.map((concept) => (
                    <option key={concept._id} value={concept.name}>
                      {concept.name.charAt(0).toUpperCase() + concept.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="club-filters"> {/* Nuevo filtro de club */}
                <select
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Seleccionar Club</option>
                  <option value="El Palmar">El Palmar</option>
                  <option value="Valladares">Valladares</option>
                </select>
              </div>
              <div className="download-actions">
                <button className="download-btn" onClick={handleDownloadExcel}>
                  <FaDownload /> Descargar Excel
                </button>
                <button className="download-btn pdf-btn" onClick={handleDownloadPDF}>
                  <FaFilePdf /> Descargar PDF
                </button>
              </div>
            </div>
          </section>
          <section className="students-table-payment">
            <div className="table-wrapper">
              <table className="students-payment">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre Completo</th>
                    <th>DNI</th>
                    <th>Fecha de Nacimiento</th>
                    <th>Club</th> {/* Nueva columna para club */}
                    {conceptFilter && (
                      <>
                        <th>Concepto</th>
                        <th>Monto</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => {
                      const payment = conceptFilter ? getPaymentByConcept(student._id, conceptFilter) : null;
                      return (
                        <tr key={student._id}>
                          <td>{index + 1}</td>
                          <td>{`${student.name} ${student.lastName}`}</td>
                          <td>{student.dni}</td>
                          <td>{formatDate(student.birthDate)}</td>
                          <td>{student.club || 'N/A'}</td> {/* Nueva celda para club */}
                          {conceptFilter && (
                            <>
                              <td>{conceptFilter}</td>
                              <td>{payment ? `$${payment.amount.toLocaleString('es-ES')}` : 'Pendiente'}</td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={conceptFilter ? 7 : 5} className="empty-table-message">
                        No se encontraron alumnos con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ListStudent;