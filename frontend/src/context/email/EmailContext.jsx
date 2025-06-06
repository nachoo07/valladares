import { createContext, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { LoginContext } from '../login/LoginContext';

export const EmailContext = createContext();

const EmailProvider = ({ children }) => {
  const { auth } = useContext(LoginContext);

  const sendVoucherEmail = async (student, cuota, imageBase64) => {
    if (auth !== 'admin') return;
    try {
      if (!student.mail) {
        Swal.fire('¡Error!', 'El estudiante no tiene un correo registrado.', 'error');
        return;
      }

      const emailData = {
        recipients: [student.mail],
        subject: `Comprobante de Pago - ${student.name} ${student.lastName}`,
        message: `
          <h2>Comprobante de Pago</h2>
          <p>Hola ${student.name},</p>
          <p>Adjuntamos el comprobante de pago de tu cuota correspondiente al mes de ${new Date(
            cuota.date
          ).toLocaleString('es-ES', { month: 'long' })}.</p>
          <p>Gracias por tu pago.</p>
          <p>Saludos,</p>
          <p>Equipo Valladares</p>
        `,
        attachment: imageBase64,
      };

      await axios.post('/api/email/send', emailData, { withCredentials: true });
      Swal.fire('¡Éxito!', 'El comprobante ha sido enviado al correo del estudiante.', 'success');
    } catch (error) {
      console.error('Error al enviar el comprobante:', error);
      Swal.fire('¡Error!', 'No se pudo enviar el comprobante. Intenta de nuevo.', 'error');
      throw error;
    }
  };

  const sendMultipleEmails = async (emails) => {
    if (auth !== 'admin') throw new Error('No autorizado');
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('No hay correos válidos para enviar.');
    }

    try {
      const response = await axios.post(
        '/api/email/send',
        { emails },
        { withCredentials: true }
      );
      Swal.fire('¡Éxito!', response.data.message, 'success');
    } catch (error) {
      console.error('Error al enviar correos:', error);
      const message = error.response?.data?.failed
        ? `No se pudieron enviar correos a: ${error.response.data.failed.map(f => f.recipient).join(', ')}`
        : error.response?.data?.message || 'No se pudieron enviar los correos.';
      Swal.fire('Error', message, 'error');
      throw new Error(message);
    }
  };

  return (
    <EmailContext.Provider value={{ sendVoucherEmail, sendMultipleEmails }}>
      {children}
    </EmailContext.Provider>
  );
};

export default EmailProvider;