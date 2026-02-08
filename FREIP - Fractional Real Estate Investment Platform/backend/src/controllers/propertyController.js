import { Property, Investment } from '../models/index.js';

export const getAllProperties = async (req, res) => {
  try {
    const { city, property_type, status } = req.query;

    const properties = await Property.findAll({
      city,
      property_type,
      status: status || 'active'
    });

    res.json({
      count: properties.length,
      properties
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Get investor count
    const investments = await Investment.findByProperty(id);

    res.json({
      ...property,
      investor_count: investments.length,
      total_invested: investments.reduce((sum, inv) => sum + inv.amount_invested, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProperty = async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only sellers can create properties' });
    }

    const {
      title, description, location, address, city, property_type,
      area_sqft, total_value, funding_target, min_investment,
      max_investment, expected_returns_annual, rental_yield
    } = req.body;

    const property = await Property.create({
      seller_id: req.user.id,
      title,
      description,
      location,
      address,
      city,
      property_type,
      area_sqft,
      total_value,
      funding_target,
      min_investment,
      max_investment,
      expected_returns_annual,
      rental_yield
    });

    res.status(201).json({
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.seller_id !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    const updatedProperty = await Property.update(id, req.body);

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSellerProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({ seller_id: req.user.id });

    res.json({
      count: properties.length,
      properties
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
