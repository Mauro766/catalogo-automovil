export const formatCurrency = (amount: number, currency: 'ARS' | 'USD' = 'ARS'): string => {
  const locale = currency === 'ARS' ? 'es-AR' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'ARS' ? 0 : 2,
  }).format(amount);
};

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('es-ES').format(value);

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));

export const formatDateTimeLocal = (date: string): string => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`;
};

export const formatPublicationAge = (publishedAt: string, now = new Date()): string => {
  const publicationDate = new Date(publishedAt);
  if (Number.isNaN(publicationDate.getTime())) {
    return 'Fecha de publicación no disponible';
  }

  const publicationDay = Date.UTC(
    publicationDate.getFullYear(),
    publicationDate.getMonth(),
    publicationDate.getDate(),
  );
  const currentDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDifference = Math.round((currentDay - publicationDay) / 86_400_000);

  if (dayDifference < 0) {
    return `Se publica el ${formatDate(publishedAt)}`;
  }
  if (dayDifference === 0) {
    return 'Publicado hoy';
  }
  return `Publicado hace ${dayDifference} ${dayDifference === 1 ? 'día' : 'días'}`;
};
