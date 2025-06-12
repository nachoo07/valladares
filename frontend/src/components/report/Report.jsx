import { useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaBars, FaTimes,FaList, FaUsers, FaMoneyBill, FaChartBar, FaExchangeAlt, FaCalendarCheck,
  FaUserCog, FaCog, FaEnvelope, FaHome, FaClipboardList, FaArrowLeft, FaUserCircle, FaChevronDown, FaTimes as FaTimesClear
} from 'react-icons/fa';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import GraphicMonthly from '../graphic/GraphicMonthly';
import CalendarReport from '../calendar/CalendarReport';
import { StudentsContext } from '../../context/student/StudentContext';
import { SharesContext } from '../../context/share/ShareContext';
import { MotionContext } from '../../context/motion/MotionContext';
import { LoginContext } from '../../context/login/LoginContext';
import { PaymentContext } from '../../context/payment/PaymentContext'; // Importar PaymentContext
import './report.css';
import AppNavbar from '../navbar/AppNavbar';
import logo from '../../assets/logo.png';

dayjs.locale('es');

const Report = () => {
  const { countStudentsByState } = useContext(StudentsContext);
  const { obtenerCuotasPorFecha, obtenerCuotasPorFechaRange, cuotas, loading: loadingCuotas } = useContext(SharesContext);
  const { getMotionsByDate, getMotionsByDateRange, loading: loadingMotions } = useContext(MotionContext);
  const { auth, logout, userData } = useContext(LoginContext);
  const { payments, fetchAllPayments, loading: loadingPayments } = useContext(PaymentContext); // Usar PaymentContext
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth >= 768);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const hasFetched = useRef(false);

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
    { name: 'Lista de Movimientos', route: '/listeconomic', icon: <FaList />, category: 'finanzas' }
  ];

  const activos = useMemo(() => countStudentsByState('Activo') || 0, [countStudentsByState]);
  const inactivos = useMemo(() => countStudentsByState('Inactivo') || 0, [countStudentsByState]);

  const [selectedDateCuotas, setSelectedDateCuotas] = useState(dayjs());
  const [selectedDateReporte, setSelectedDateReporte] = useState(dayjs());
  const [selectedDateIngresos, setSelectedDateIngresos] = useState(dayjs());
  const [selectedDateEgresos, setSelectedDateEgresos] = useState(dayjs());
  const [selectedDatePagos, setSelectedDatePagos] = useState(dayjs()); // Nuevo estado para pagos
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  const [data, setData] = useState({
    efectivoCuotas: 0,
    transferenciaCuotas: 0,
    ingreso: 0,
    egreso: 0,
    efectivoIngreso: 0,
    transferenciaIngreso: 0,
    efectivoEgreso: 0,
    transferenciaEgreso: 0,
    efectivoPagos: 0, // Nuevo campo para pagos en efectivo
    transferenciaPagos: 0, // Nuevo campo para pagos por transferencia
    monthlyData: {
      totalCuotas: 0,
      totalIngresos: 0,
      totalEgresos: 0,
      balanceFinal: 0,
      efectivoDisponible: 0,
      transferenciaDisponible: 0,
    },
  });

  const fetchCuotasStatus = useMemo(() => {
    const cuotasArray = Array.isArray(cuotas) ? cuotas : [];
    return {
      pendientes: cuotasArray.filter((cuota) => cuota.state === 'Pendiente').length,
      vencidas: cuotasArray.filter((cuota) => cuota.state === 'Vencido').length,
    };
  }, [cuotas]);

  const fetchDailyData = useCallback(async (dateCuotas, dateReporte, dateIngresos, dateEgresos, datePagos) => {
    const dateStrCuotas = dateCuotas.format('YYYY-MM-DD');
    const cuotasData = await obtenerCuotasPorFecha(dateStrCuotas);
    const cuotasArray = Array.isArray(cuotasData) ? cuotasData : [];
    const efectivoCuotas = cuotasArray
      .filter((c) => c.paymentmethod === 'Efectivo')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const transferenciaCuotas = cuotasArray
      .filter((c) => c.paymentmethod === 'Transferencia')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const dateStrReporte = dateReporte.format('YYYY-MM-DD');
    const motionsDataReporte = await getMotionsByDate(dateStrReporte);
    const motionsArrayReporte = Array.isArray(motionsDataReporte) ? motionsDataReporte : [];
    const ingreso = motionsArrayReporte
      .filter((m) => m.incomeType === 'ingreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const egreso = motionsArrayReporte
      .filter((m) => m.incomeType === 'egreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    const dateStrIngresos = dateIngresos.format('YYYY-MM-DD');
    const motionsDataIngresos = await getMotionsByDate(dateStrIngresos);
    const motionsArrayIngresos = Array.isArray(motionsDataIngresos) ? motionsDataIngresos : [];
    const efectivoIngreso = motionsArrayIngresos
      .filter((m) => m.paymentMethod.toLowerCase() === 'efectivo' && m.incomeType === 'ingreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const transferenciaIngreso = motionsArrayIngresos
      .filter((m) => m.paymentMethod.toLowerCase() === 'transferencia' && m.incomeType === 'ingreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    const dateStrEgresos = dateEgresos.format('YYYY-MM-DD');
    const motionsDataEgresos = await getMotionsByDate(dateStrEgresos);
    const motionsArrayEgresos = Array.isArray(motionsDataEgresos) ? motionsDataEgresos : [];
    const efectivoEgreso = motionsArrayEgresos
      .filter((m) => m.paymentMethod.toLowerCase() === 'efectivo' && m.incomeType === 'egreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const transferenciaEgreso = motionsArrayEgresos
      .filter((m) => m.paymentMethod.toLowerCase() === 'transferencia' && m.incomeType === 'egreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    // Fetch pagos
    const dateStrPagos = datePagos.format('YYYY-MM-DD');
    await fetchAllPayments(); // Asegura que los pagos estén cargados
    const paymentsArray = Array.isArray(payments) ? payments : [];
    const filteredPayments = paymentsArray.filter((p) => {
      const paymentDate = new Date(p.paymentDate || p.date);
      return paymentDate.toISOString().split('T')[0] === dateStrPagos;
    });
    const efectivoPagos = filteredPayments
      .filter((p) => (p.paymentMethod || p.paymentmethod).toLowerCase() === 'efectivo')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const transferenciaPagos = filteredPayments
      .filter((p) => (p.paymentMethod || p.paymentmethod).toLowerCase() === 'transferencia')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    setData((prev) => ({
      ...prev,
      efectivoCuotas,
      transferenciaCuotas,
      ingreso,
      egreso,
      efectivoIngreso,
      transferenciaIngreso,
      efectivoEgreso,
      transferenciaEgreso,
      efectivoPagos,
      transferenciaPagos,
    }));
  }, [obtenerCuotasPorFecha, getMotionsByDate, fetchAllPayments]);

  const fetchMonthlyData = useCallback(async (month) => {
    const startOfMonth = month.startOf('month').format('YYYY-MM-DD');
    const endOfMonth = month.endOf('month').format('YYYY-MM-DD');
    const [cuotas, motions] = await Promise.all([
      obtenerCuotasPorFechaRange(startOfMonth, endOfMonth),
      getMotionsByDateRange(startOfMonth, endOfMonth),
    ]);

    const cuotasArray = Array.isArray(cuotas) ? cuotas : [];
    const motionsArray = Array.isArray(motions) ? motions : [];

    const totalCuotas = cuotasArray.reduce((sum, cuota) => sum + (cuota.amount || 0), 0);
    const totalIngresos = motionsArray
      .filter((m) => m.incomeType === 'ingreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalEgresos = motionsArray
      .filter((m) => m.incomeType === 'egreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const efectivoCuotas = cuotasArray
      .filter((c) => c.paymentmethod === 'Efectivo')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const transferenciaCuotas = cuotasArray
      .filter((c) => c.paymentmethod === 'Transferencia')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const efectivoIngresos = motionsArray
      .filter((m) => m.paymentMethod.toLowerCase() === 'efectivo' && m.incomeType === 'ingreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const transferenciaIngresos = motionsArray
      .filter((m) => m.paymentMethod.toLowerCase() === 'transferencia' && m.incomeType === 'ingreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const efectivoEgresos = motionsArray
      .filter((m) => m.paymentMethod.toLowerCase() === 'efectivo' && m.incomeType === 'egreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const transferenciaEgresos = motionsArray
      .filter((m) => m.paymentMethod.toLowerCase() === 'transferencia' && m.incomeType === 'egreso')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    // Fetch pagos mensuales
    await fetchAllPayments();
    const paymentsArray = Array.isArray(payments) ? payments : [];
    const filteredPayments = paymentsArray.filter((p) => {
      const paymentDate = new Date(p.paymentDate || p.date);
      return paymentDate >= new Date(startOfMonth) && paymentDate <= new Date(endOfMonth);
    });
    const efectivoPagos = filteredPayments
      .filter((p) => (p.paymentMethod || p.paymentmethod).toLowerCase() === 'efectivo')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const transferenciaPagos = filteredPayments
      .filter((p) => (p.paymentMethod || p.paymentmethod).toLowerCase() === 'transferencia')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    setData((prev) => ({
      ...prev,
      monthlyData: {
        totalCuotas,
        totalIngresos,
        totalEgresos,
        balanceFinal: totalCuotas + totalIngresos - totalEgresos + efectivoPagos + transferenciaPagos, // Incluir pagos
        efectivoDisponible: efectivoCuotas + efectivoIngresos - efectivoEgresos + efectivoPagos,
        transferenciaDisponible: transferenciaCuotas + transferenciaIngresos - transferenciaEgresos + transferenciaPagos,
      },
    }));
  }, [obtenerCuotasPorFechaRange, getMotionsByDateRange, fetchAllPayments]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDailyData(selectedDateCuotas, selectedDateReporte, selectedDateIngresos, selectedDateEgresos, selectedDatePagos);
      fetchMonthlyData(selectedMonth);
    }
  }, [selectedDateCuotas, selectedDateReporte, selectedDateIngresos, selectedDateEgresos, selectedDatePagos, selectedMonth, fetchDailyData, fetchMonthlyData]);

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

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
      <div className="dashboard-container">
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
                    className={`sidebar-menu-item ${item.route === '/report' ? 'active' : ''}`}
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
        <div className="content-container">
          <div className="welcome-text">
            <h1>Panel de Reporte</h1>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3 className="titulo-card color-card">Alumnos Activos</h3>
              <p className="stat-value">{activos}</p>
            </div>
            <div className="stat-card">
              <h3 className="titulo-card color-card">Alumnos Inactivos</h3>
              <p className="stat-value">{inactivos}</p>
            </div>
            <div className="stat-card">
              <h3 className="titulo-card color-card">Cuotas Pendientes</h3>
              <p className="stat-value">{fetchCuotasStatus.pendientes}</p>
            </div>
            <div className="stat-card">
              <h3 className="titulo-card color-card">Cuotas Vencidas</h3>
              <p className="stat-value">{fetchCuotasStatus.vencidas}</p>
            </div>
          </div>
          <div className="charts-grid">
            <div className="chart-card1">
              <div className="chart-card">
                <div className="header-cuotas">
                  <h3 className="titulo-cuota">Cuotas</h3>
                  <div>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                      <DatePicker
                        value={selectedDateCuotas}
                        maxDate={dayjs()}
                        onChange={(newValue) => {
                          setSelectedDateCuotas(newValue);
                          fetchDailyData(newValue, selectedDateReporte, selectedDateIngresos, selectedDateEgresos, selectedDatePagos);
                        }}
                        className="custom-datepicker"
                      />
                    </LocalizationProvider>
                  </div>
                </div>
                <div className="chart-stats">
                  <div className="stat-item">
                    <span className="stat-label">Efectivo:</span>
                    <span className="stat-value">${data.efectivoCuotas.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Transferencia:</span>
                    <span className="stat-value">${data.transferenciaCuotas.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">${(data.efectivoCuotas + data.transferenciaCuotas).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              </div>
              <div className="chart-card">
                <div className="header-cuotas">
                  <h3 className="titulo-cuota">Pagos de Alumnos</h3> {/* Nueva sección para pagos */}
                  <div>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                      <DatePicker
                        value={selectedDatePagos}
                        maxDate={dayjs()}
                        onChange={(newValue) => {
                          setSelectedDatePagos(newValue);
                          fetchDailyData(selectedDateCuotas, selectedDateReporte, selectedDateIngresos, selectedDateEgresos, newValue);
                        }}
                        className="custom-datepicker"
                      />
                    </LocalizationProvider>
                  </div>
                </div>
                <div className="chart-stats">
                  <div className="stat-item">
                    <span className="stat-label">Efectivo:</span>
                    <span className="stat-value">${data.efectivoPagos.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Transferencia:</span>
                    <span className="stat-value">${data.transferenciaPagos.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">${(data.efectivoPagos + data.transferenciaPagos).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="chart-card1">
              <div className="chart-card">
                <div className="header-cuotas">
                  <h3 className="titulo-cuota">Ingresos</h3>
                  <div>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                      <DatePicker
                        value={selectedDateIngresos}
                        maxDate={dayjs()}
                        onChange={(newValue) => {
                          setSelectedDateIngresos(newValue);
                          fetchDailyData(selectedDateCuotas, selectedDateReporte, newValue, selectedDateEgresos, selectedDatePagos);
                        }}
                        className="custom-datepicker"
                      />
                    </LocalizationProvider>
                  </div>
                </div>
                <div className="chart-stats">
                  <div className="stat-item">
                    <span className="stat-label">Efectivo:</span>
                    <span className="stat-value">${data.efectivoIngreso.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Transferencia:</span>
                    <span className="stat-value">${data.transferenciaIngreso.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">${(data.efectivoIngreso + data.transferenciaIngreso).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              </div>
              <div className="chart-card">
                <div className="header-cuotas">
                  <h3 className="titulo-cuota">Egresos</h3>
                  <div>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                      <DatePicker
                        value={selectedDateEgresos}
                        maxDate={dayjs()}
                        onChange={(newValue) => {
                          setSelectedDateEgresos(newValue);
                          fetchDailyData(selectedDateCuotas, selectedDateReporte, selectedDateIngresos, newValue, selectedDatePagos);
                        }}
                        className="custom-datepicker"
                      />
                    </LocalizationProvider>
                  </div>
                </div>
                <div className="chart-stats">
                  <div className="stat-item">
                    <span className="stat-label">Efectivo:</span>
                    <span className="stat-value">${data.efectivoEgreso.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Transferencia:</span>
                    <span className="stat-value">${data.transferenciaEgreso.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">${(data.efectivoEgreso + data.transferenciaEgreso).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="chart-card full-width">
              <div className="header-mensual">
                <h3 className="titulo-mensual">Reporte Mensual</h3>
                <div className="calendar-container">
                  <CalendarReport onMonthChange={(newMonth) => {
                    setSelectedMonth(dayjs(newMonth));
                    fetchMonthlyData(dayjs(newMonth));
                  }} />
                </div>
              </div>
              <div>
                <GraphicMonthly data={data.monthlyData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;