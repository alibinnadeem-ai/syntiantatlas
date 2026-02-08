import { User } from '../models/index.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role_id,
      kyc_status: user.kyc_status,
      kyc_level: user.kyc_level,
      wallet_balance: user.wallet_balance,
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;

    const updatedUser = await User.update(req.user.id, {
      first_name,
      last_name,
      phone
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      wallet_balance: user.wallet_balance,
      currency: 'PKR'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
