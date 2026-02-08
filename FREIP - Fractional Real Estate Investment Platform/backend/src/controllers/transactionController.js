import { Transaction, User } from '../models/index.js';

export const depositFunds = async (req, res) => {
  try {
    const { amount, payment_method, gateway } = req.body;

    const transaction = await Transaction.create({
      user_id: req.user.id,
      type: 'deposit',
      amount,
      payment_method,
      gateway,
      description: `Fund deposit via ${payment_method}`
    });

    res.status(201).json({
      message: 'Deposit initiated',
      transaction_id: transaction.id,
      status: transaction.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;

    const user = await User.findById(req.user.id);
    if (user.wallet_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const transaction = await Transaction.create({
      user_id: req.user.id,
      type: 'withdrawal',
      amount,
      description: 'Fund withdrawal'
    });

    res.status(201).json({
      message: 'Withdrawal initiated',
      transaction_id: transaction.id,
      status: transaction.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.findByUser(req.user.id);

    const summary = {
      total_deposits: transactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      total_withdrawals: transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      total_investments: transactions
        .filter(t => t.type === 'investment' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      total_dividends: transactions
        .filter(t => t.type === 'dividend' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
    };

    res.json({
      summary,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
