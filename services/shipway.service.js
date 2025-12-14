import dotenv from 'dotenv';
dotenv.config();

// Shipway API configuration
const SHIPWAY_API_BASE_URL = process.env.SHIPWAY_API_BASE_URL;
const SHIPWAY_USERNAME = process.env.SHIPWAY_USERNAME;
const SHIPWAY_PASSWORD = process.env.SHIPWAY_PASSWORD;
const SHIPWAY_LICENSE_KEY = process.env.SHIPWAY_LICENSE_KEY;

// Get Shipway authentication headers
const getShipwayHeaders = () => {
  if (!SHIPWAY_USERNAME || !SHIPWAY_PASSWORD || !SHIPWAY_LICENSE_KEY) {
    throw new Error('Shipway credentials are not configured. Please set SHIPWAY_USERNAME, SHIPWAY_PASSWORD, and SHIPWAY_LICENSE_KEY in your .env file.');
  }

  // Basic authentication for Shipway API
  const authString = Buffer.from(`${SHIPWAY_USERNAME}:${SHIPWAY_PASSWORD}`).toString('base64');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${authString}`,
    'License-Key': SHIPWAY_LICENSE_KEY,
  };
};

export const shipwayService = {
  /**
   * Create a shipment in Shipway
   */
  async createShipment(orderData) {
    try {
      const headers = getShipwayHeaders();

      // Prepare shipment data according to Shipway API format
      const shipmentData = {
        OrderNumber: orderData.orderId,
        CustomerName: orderData.shippingInfo.fullName,
        CustomerEmail: orderData.shippingInfo.email,
        CustomerPhone: orderData.shippingInfo.phone,
        CustomerAddress: orderData.shippingInfo.address,
        CustomerCity: orderData.shippingInfo.city,
        CustomerState: orderData.shippingInfo.state,
        CustomerPincode: orderData.shippingInfo.pincode,
        ProductName: orderData.items.map(item => `${item.name} (Qty: ${item.quantity})`).join(', '),
        ProductQuantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
        ProductPrice: orderData.total,
        PaymentMode: orderData.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        CODAmount: orderData.paymentMethod === 'cod' ? orderData.total : 0,
        OrderDate: new Date().toISOString(),
        // Additional fields that can be configured
        Weight: process.env.SHIPWAY_DEFAULT_WEIGHT || '0.5', // in kg
        Length: process.env.SHIPWAY_DEFAULT_LENGTH || '10', // in cm
        Breadth: process.env.SHIPWAY_DEFAULT_BREADTH || '10', // in cm
        Height: process.env.SHIPWAY_DEFAULT_HEIGHT || '10', // in cm
      };

      console.log('Creating Shipway shipment with data:', JSON.stringify(shipmentData, null, 2));

      const response = await fetch(`${SHIPWAY_API_BASE_URL}/CreateOrder`, {
        method: 'POST',
        headers,
        body: JSON.stringify(shipmentData),
      });

      const responseData = await response.json();

      console.log('Shipway create shipment response:', {
        status: response.status,
        data: responseData,
      });

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Shipway API error: ${response.status}`);
      }

      // Shipway typically returns shipment details including tracking number
      return {
        shipmentId: responseData.OrderId || responseData.ShipmentId || responseData.id,
        trackingNumber: responseData.TrackingNumber || responseData.AWB || responseData.tracking_number,
        awbNumber: responseData.AWB || responseData.awb_number || responseData.TrackingNumber,
        courierName: responseData.CourierName || responseData.courier_name || '',
        courierTrackingUrl: responseData.TrackingURL || responseData.tracking_url || '',
        labelUrl: responseData.LabelURL || responseData.label_url || '',
        manifestUrl: responseData.ManifestURL || responseData.manifest_url || '',
        status: responseData.Status || 'created',
        estimatedDeliveryDate: responseData.EstimatedDeliveryDate || null,
        rawResponse: responseData,
      };
    } catch (error) {
      console.error('Shipway create shipment error:', error.message);
      throw error;
    }
  },

  /**
   * Track a shipment by tracking number or AWB
   */
  async trackShipment(trackingNumber) {
    try {
      const headers = getShipwayHeaders();

      const response = await fetch(`${SHIPWAY_API_BASE_URL}/TrackOrder?TrackingNumber=${trackingNumber}`, {
        method: 'GET',
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Shipway API error: ${response.status}`);
      }

      return {
        trackingNumber: responseData.TrackingNumber || responseData.AWB,
        status: responseData.Status || responseData.CurrentStatus,
        statusDescription: responseData.StatusDescription || responseData.Description,
        location: responseData.Location || responseData.CurrentLocation,
        estimatedDeliveryDate: responseData.EstimatedDeliveryDate,
        deliveredDate: responseData.DeliveredDate,
        trackingHistory: responseData.TrackingHistory || responseData.history || [],
        rawResponse: responseData,
      };
    } catch (error) {
      console.error('Shipway track shipment error:', error.message);
      throw error;
    }
  },

  /**
   * Get shipping label for a shipment
   */
  async getLabel(shipmentId) {
    try {
      const headers = getShipwayHeaders();

      const response = await fetch(`${SHIPWAY_API_BASE_URL}/GetLabel?OrderId=${shipmentId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Shipway API error: ${response.status}`);
      }

      // Label might be returned as URL or base64 data
      const responseData = await response.json();

      return {
        labelUrl: responseData.LabelURL || responseData.label_url || responseData.url,
        labelData: responseData.LabelData || responseData.data,
        format: responseData.Format || 'PDF',
        rawResponse: responseData,
      };
    } catch (error) {
      console.error('Shipway get label error:', error.message);
      throw error;
    }
  },

  /**
   * Cancel a shipment
   */
  async cancelShipment(shipmentId) {
    try {
      const headers = getShipwayHeaders();

      const response = await fetch(`${SHIPWAY_API_BASE_URL}/CancelOrder`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          OrderId: shipmentId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Shipway API error: ${response.status}`);
      }

      return {
        success: true,
        message: responseData.message || 'Shipment cancelled successfully',
        rawResponse: responseData,
      };
    } catch (error) {
      console.error('Shipway cancel shipment error:', error.message);
      throw error;
    }
  },

  /**
   * Get available couriers for a pincode
   */
  async getAvailableCouriers(pincode) {
    try {
      const headers = getShipwayHeaders();

      const response = await fetch(`${SHIPWAY_API_BASE_URL}/GetCouriers?Pincode=${pincode}`, {
        method: 'GET',
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Shipway API error: ${response.status}`);
      }

      return {
        couriers: responseData.Couriers || responseData.couriers || [],
        rawResponse: responseData,
      };
    } catch (error) {
      console.error('Shipway get available couriers error:', error.message);
      throw error;
    }
  },
};

