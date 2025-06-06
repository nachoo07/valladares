import Share from '../../models/share/share.model.js';
import Student from '../../models/student/student.model.js';
import Config from '../../models/base/config.model.js';
import pino from 'pino';
import { DateTime } from 'luxon';

const logger = pino();

export const calculateShareAmount = (baseAmount, currentDay) => {
  if (currentDay > 20) {
    return { amount: baseAmount * 1.2, state: 'Vencido' }; // 20% aumento después del día 20
  } else if (currentDay > 10) {
    return { amount: baseAmount * 1.1, state: 'Vencido' }; // 10% aumento del día 11 al 20
  }
  return { amount: baseAmount, state: 'Pendiente' }; // Sin aumento del día 1 al 10
};

export const updateShares = async () => {
  const currentDate = DateTime.now().setZone('America/Argentina/Tucuman');
  logger.info(`Fecha actual en UTC-3: ${currentDate.toString()}`);
  const currentDay = currentDate.day; // Usa .day para obtener el día del mes
  logger.info(`Ejecutando actualización de cuotas con fecha: ${currentDate.toISODate()}`); // Usa toISODate() para el formato YYYY-MM-DD

  try {
    const config = await Config.findOne({ key: 'cuotaBase' });
    if (!config) throw new Error('No se encontró la configuración de cuotaBase');
    const cuotaBase = config.value || 30000;

    const shares = await Share.find({ $or: [{ state: 'Pendiente' }, { state: 'Vencido' }] }).lean();
    const studentIds = [...new Set(shares.map(s => s.student))];
    const students = await Student.find({ _id: { $in: studentIds } }).lean();

    const bulkOps = shares.map(share => {
      const student = students.find(s => s._id.equals(share.student));
      const baseAmount = student && student.hasSiblingDiscount ? cuotaBase * 0.9 : cuotaBase;
      const { amount, state } = calculateShareAmount(baseAmount, currentDay);

      return {
        updateOne: {
          filter: { _id: share._id },
          update: { amount: Math.round(amount), state, updatedAt: DateTime.now().toJSDate() }
        }
      };
    });

    if (bulkOps.length > 0) {
      await Share.bulkWrite(bulkOps);
      logger.info({ updatedCount: bulkOps.length }, 'Cuotas actualizadas correctamente');
    } else {
      logger.info('No se encontraron cuotas para actualizar');
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error al actualizar cuotas');
    throw error;
  }
};