import { Client } from '@googlemaps/google-maps-services-js';
import { config } from 'dotenv';

config();

interface LocationData {
  lat: number;
  lng: number;
  formatted_address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

class GoogleMapsService {
  private client: Client;
  private apiKey: string;
  private geocodeCache: Map<string, LocationData>;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    this.geocodeCache = new Map();
    
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. Location services will be disabled.');
    }
  }

  /**
   * Convert address to coordinates using Google Geocoding API
   */
  async geocodeAddress(address: string): Promise<LocationData> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Check cache first
    if (this.geocodeCache.has(address)) {
      return this.geocodeCache.get(address)!;
    }

    try {
      const response = await this.client.geocode({
        params: {
          address: address,
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0 || !response.data.results[0]) {
        throw new Error('Address not found');
      }

      const result = response.data.results[0];
      if (!result || !result.geometry || !result.geometry.location || !result.address_components) {
        throw new Error('Invalid geocoding response structure');
      }
      const location = result.geometry.location;
      const components = result.address_components;

      const locationData: LocationData = {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        city: this.extractComponent(components, 'locality') || 
              this.extractComponent(components, 'administrative_area_level_2') || '',
        state: this.extractComponent(components, 'administrative_area_level_1') || '',
        country: this.extractComponent(components, 'country') || '',
        postal_code: this.extractComponent(components, 'postal_code') || '',
      };

      // Cache the result
      this.geocodeCache.set(address, locationData);
      
      return locationData;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Failed to geocode address: ${address}`);
    }
  }

  /**
   * Convert coordinates to address using Google Reverse Geocoding API
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationData> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const cacheKey = `${lat},${lng}`;
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!;
    }

    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('Location not found');
      }

      const result = response.data.results[0];
      if (!result || !result.address_components) {
        throw new Error('Invalid reverse geocoding response structure');
      }
      const components = result.address_components;

      const locationData: LocationData = {
        lat,
        lng,
        formatted_address: result.formatted_address,
        city: this.extractComponent(components, 'locality') || 
              this.extractComponent(components, 'administrative_area_level_2') || '',
        state: this.extractComponent(components, 'administrative_area_level_1') || '',
        country: this.extractComponent(components, 'country') || '',
        postal_code: this.extractComponent(components, 'postal_code') || '',
      };

      // Cache the result
      this.geocodeCache.set(cacheKey, locationData);
      
      return locationData;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error(`Failed to reverse geocode coordinates: ${lat}, ${lng}`);
    }
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Calculate distance between two points in kilometers
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get location from IP address as fallback
   */
  async getLocationFromIP(ip?: string): Promise<Partial<LocationData>> {
    try {
      // Using a free IP geolocation service
      const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.error) {
        throw new Error(data.reason || 'IP geolocation failed');
      }

      return {
        lat: data.latitude,
        lng: data.longitude,
        city: data.city || '',
        state: data.region || '',
        country: data.country_name || '',
        postal_code: data.postal || '',
        formatted_address: `${data.city}, ${data.region}, ${data.country_name}`
      };
    } catch (error) {
      console.error('IP geolocation error:', error);
      throw new Error('Could not determine location from IP');
    }
  }

  /**
   * Extract address component by type
   */
  private extractComponent(components: AddressComponent[], type: string): string {
    const component = components.find(c => c.types.includes(type));
    return component ? component.long_name : '';
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear geocoding cache
   */
  clearCache(): void {
    this.geocodeCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.geocodeCache.size;
  }
}

export default new GoogleMapsService();