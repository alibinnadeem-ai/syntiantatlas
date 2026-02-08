import { Investment, Property, User } from '../models/index.js';

export const investInProperty = async (req, res) => {
  try {
    const { property_id, amount } = req.body;

    // Get property details
    const property = await Property.findById(property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if investment amount is within limits
    if (amount < property.min_investment || amount > property.max_investment) {
      return res.status(400).json({
        error: `Investment must be between PKR ${property.min_investment} and PKR ${property.max_investment}`
      });
    }

    // Calculate shares
    const shares = (amount / property.total_value) * 100;
    const ownership = (amount / property.funding_target) * 100;

    // Create investment record
    const investment = await Investment.create({
      investor_id: req.user.id,
      property_id,
      amount_invested: amount,
      shares_owned: shares,
      ownership_percentage: ownership
    });

    // Update property funding
    await Property.update(property_id, {
      funding_raised: property.funding_raised + amount
    });

    // Deduct from investor wallet
    const user = await User.findById(req.user.id);
    await User.update(req.user.id, {
      wallet_balance: user.wallet_balance - amount
    });

    res.status(201).json({
      message: 'Investment successful',
      investment: {
        ...investment,
        shares: shares,
        ownership_percentage: ownership
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getInvestorPortfolio = async (req, res) => {
  try {
    const investments = await Investment.findByInvestor(req.user.id);

    let totalInvested = 0;
    let totalReturns = 0;

    const portfolioItems = await Promise.all(
      investments.map(async (inv) => {
        const property = await Property.findById(inv.property_id);
        totalInvested += inv.amount_invested;
        totalReturns += inv.returns_earned || 0;

        return {
          ...inv,
          property: {
            title: property.title,
            city: property.city,
            status: property.status
          }
        };
      })
    );

    res.json({
      total_invested: totalInvested,
      total_returns: totalReturns,
      current_value: totalInvested + totalReturns,
      investment_count: investments.length,
      portfolio: portfolioItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPropertyInvestments = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await Property.findById(property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const investments = await Investment.findByProperty(property_id);

    res.json({
      property_id,
      investor_count: investments.length,
      total_raised: investments.reduce((sum, inv) => sum + inv.amount_invested, 0),
      funding_target: property.funding_target,
      funding_percentage: (investments.reduce((sum, inv) => sum + inv.amount_invested, 0) / property.funding_target) * 100,
      investments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
