import bcryptjs from 'bcryptjs';

export const hashPassword = async (password) => {
  return bcryptjs.hash(password, 10);
};

export const comparePassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

export const formatCurrency = (amount, currency = 'PKR') => {
  return `${currency} ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const calculateOwnershipPercentage = (investedAmount, totalValue) => {
  return (investedAmount / totalValue) * 100;
};

export const calculateROI = (invested, current) => {
  return ((current - invested) / invested) * 100;
};

export const calculateDividendPerShare = (netIncome, totalShares) => {
  return netIncome / totalShares;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^(?:\+92|0)[1-9]\d{1,10}$/;
  return re.test(phone);
};

export const validateCNIC = (cnic) => {
  // Pakistan CNIC format: 12345-1234567-1
  const re = /^\d{5}-\d{7}-\d{1}$/;
  return re.test(cnic);
};
