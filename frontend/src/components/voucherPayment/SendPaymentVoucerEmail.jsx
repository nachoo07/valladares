import React, { useState, useEffect, useContext } from "react";
import { Button } from "react-bootstrap";
import { FaFileInvoice, FaSpinner } from "react-icons/fa";
import { EmailContext } from "../../context/email/EmailContext";
import "./voucherPayment.css";

const SendPaymentVoucherEmail = ({ student, payment, onSendingStart, onSendingEnd }) => {
  const [loading, setLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const { sendVoucherEmail } = useContext(EmailContext);

  useEffect(() => {
    if (student && payment && payment.paymentDate && payment.paymentMethod && payment.concept) {
      setIsDataReady(true);
    } else {
      console.warn("Datos insuficientes para generar el comprobante de pago:", { student, payment });
      setIsDataReady(false);
    }
  }, [student, payment]);

  const formatDateForFilename = (date) => {
    if (!date) return "N/A";
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) return "N/A";
    return parsedDate.toLocaleDateString("es-ES", {
      timeZone: "America/Argentina/Tucuman",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCuil = (dni) => {
    if (!dni) return "N/A";
    const cleanCuil = dni.replace(/\D/g, "");
    if (cleanCuil.length === 11) {
      return `${cleanCuil.substring(0, 2)}-${cleanCuil.substring(2, 10)}-${cleanCuil.substring(10)}`;
    }
    return dni;
  };

  const handleSendVoucher = async () => {
    if (!isDataReady) {
      console.error("Datos no listos para enviar el comprobante de pago.");
      return;
    }

    setLoading(true);
    onSendingStart();
    try {
      console.time("sendVoucherEmail");
      await sendVoucherEmail(student, payment, {
        content: "Generar PDF",
        format: "pdf",
        filename: `Comprobante_Pago_${student.name}_${formatDateForFilename(payment.paymentDate).replace(/\//g, "-")}.pdf`,
        mimeType: "application/pdf",
        student: {
          name: student.name || "N/A",
          lastName: student.lastName || "",
          dni: formatCuil(student.dni),
        },
        payment: {
          concept: payment.concept || "N/A",
          amount: payment.amount
            ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(payment.amount)
            : "N/A",
          paymentMethod: payment.paymentMethod || "N/A",
          paymentDate: payment.paymentDate, // Enviamos la fecha original sin formatear
        },
      });
      console.timeEnd("sendVoucherEmail");
    } catch (error) {
      console.error("Error al enviar el correo:", error);
    } finally {
      setLoading(false);
      onSendingEnd();
    }
  };

  return (
    <>
      <Button
        className="send-voucher-payment"
        onClick={handleSendVoucher}
        disabled={loading || !isDataReady}
        title="Enviar comprobante de pago"
      >
        {!loading && <FaFileInvoice />}
        {loading && <FaSpinner className="spinner" />}
      </Button>
    </>
  );
};

export default SendPaymentVoucherEmail;