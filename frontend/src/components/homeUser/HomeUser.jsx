import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCalendarCheck, FaBars } from 'react-icons/fa';
import "./homeUser.css"
const HomeUser = () => {

  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const menuItems = [

    { name: 'Notificaciones', route: '/notification', icon: <FaBell /> },
    { name: 'Asistencia', route: '/attendance', icon: <FaCalendarCheck /> },
  ];

  return (
    <>
      <div className="dashboard-container">
        <div className={`sidebar ${isMenuOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <FaBars />
          </div>
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="sidebar-item"
              onClick={() => navigate(item.route)}
            >
              <span className="icon">{item.icon}</span>
              <span className="text">{item.name}</span>
            </div>
          ))}
        </div>
        <div className="main-content">
          <h1>Dashboard</h1>
          <div className="cards-container">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="card"
                onClick={() => navigate(item.route)}
              >
                <div className="card-icon">{item.icon}</div>
                <h3>{item.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default HomeUser