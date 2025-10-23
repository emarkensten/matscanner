// Livsmedelsverket API integration for Swedish food nutrition data
// API Documentation: https://dataportal.livsmedelsverket.se/livsmedel/swagger/index.html
// License: Creative Commons Attribution 4.0

// Livsmedelsverket API - Working endpoint confirmed 2025-10-23
const API_BASE_URL = 'https://dataportal.livsmedelsverket.se/livsmedel/api/v1';
const API_TIMEOUT = 5000; // 5 second timeout to avoid slow responses

// Types based on actual Livsmedelsverket API response
export interface LivsmedelsverketFood {
  nummer: number;
  namn: string;
  vetenskapligtNamn?: string;
  livsmedelsTyp: string;
  version?: string;
  projekt?: string;
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface LivsmedelsverketResponse {
  _meta: {
    totalRecords: number;
    offset: number;
    limit: number;
    count: number;
  };
  _links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  livsmedel: LivsmedelsverketFood[];
}

export interface NutritionValue {
  namn: string; // Nutrient name
  varde: number; // Value
  enhet: string; // Unit (g, mg, µg)
  forkortning?: string; // Abbreviation
  euroFIRkod?: string; // Euro FIR code
}

export interface SwedishNutritionData {
  foodId: number;
  foodName: string;
  energy_kcal?: number;
  energy_kJ?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  saturated_fat_g?: number;
  salt_g?: number;
  calcium_mg?: number;
  iron_mg?: number;
  vitamin_c_mg?: number;
  vitamin_d_ug?: number;
}

/**
 * Search for Swedish food items by name
 * @param query Search term (e.g., "mjölk", "bröd")
 * @returns Array of matching food items
 */
export async function searchSwedishFood(
  query: string
): Promise<LivsmedelsverketFood[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    // Fetch more items to increase chance of matches (API has 2569 items total)
    const response = await fetch(`${API_BASE_URL}/livsmedel?limit=200`, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Livsmedelsverket API returned status ${response.status}`);
      return [];
    }

    const data: LivsmedelsverketResponse = await response.json();

    // Filter results based on search query
    const searchLower = query.toLowerCase();
    return data.livsmedel.filter((food) =>
      food.namn.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Livsmedelsverket API timeout - using Open Food Facts data only');
    } else {
      console.warn('Livsmedelsverket API unavailable - using Open Food Facts data only');
    }
    return [];
  }
}

/**
 * Get detailed nutrition data for a specific Swedish food item
 * @param foodId Livsmedelsverket food ID (Nummer)
 * @returns Normalized nutrition data
 */
export async function getSwedishNutrition(
  foodId: number
): Promise<SwedishNutritionData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    // Fetch the food item details
    const foodResponse = await fetch(`${API_BASE_URL}/livsmedel/${foodId}`, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!foodResponse.ok) {
      clearTimeout(timeoutId);
      console.warn(`Livsmedelsverket API returned status ${foodResponse.status}`);
      return null;
    }

    const foodData: LivsmedelsverketFood = await foodResponse.json();

    // Fetch nutrition values
    const nutritionResponse = await fetch(
      `${API_BASE_URL}/livsmedel/${foodId}/naringsvarden`,
      {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!nutritionResponse.ok) {
      console.warn(`Livsmedelsverket nutrition API returned status ${nutritionResponse.status}`);
      return null;
    }

    const nutritionData: NutritionValue[] = await nutritionResponse.json();

    // Normalize nutrition data
    return normalizeNutritionData(foodData, nutritionData);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Livsmedelsverket API timeout');
    } else {
      console.warn('Livsmedelsverket API unavailable');
    }
    return null;
  }
}

/**
 * Normalize Livsmedelsverket nutrition data to our standard format
 */
function normalizeNutritionData(
  food: LivsmedelsverketFood,
  nutrients: NutritionValue[]
): SwedishNutritionData {
  const findNutrient = (names: string[]): number | undefined => {
    for (const name of names) {
      const nutrient = nutrients.find((n) =>
        n.namn.toLowerCase().includes(name.toLowerCase()) ||
        n.forkortning?.toLowerCase() === name.toLowerCase()
      );
      if (nutrient) return nutrient.varde;
    }
    return undefined;
  };

  return {
    foodId: food.nummer,
    foodName: food.namn,
    energy_kcal: findNutrient(['energi (kcal)', 'kcal']),
    energy_kJ: findNutrient(['energi (kj)', 'kj']),
    protein_g: findNutrient(['protein']),
    carbs_g: findNutrient(['kolhydrat', 'carbs']),
    fat_g: findNutrient(['fett', 'fat']),
    fiber_g: findNutrient(['fiber']),
    sugar_g: findNutrient(['sockerarter', 'socker']),
    saturated_fat_g: findNutrient(['mättat fett', 'mättade fettsyror']),
    salt_g: findNutrient(['salt', 'nacl']),
    calcium_mg: findNutrient(['kalcium', 'ca']),
    iron_mg: findNutrient(['järn', 'fe']),
    vitamin_c_mg: findNutrient(['vitamin c', 'vitc', 'askorbinsyra']),
    vitamin_d_ug: findNutrient(['vitamin d', 'vitd']),
  };
}

/**
 * Search for Swedish food and get the best match with nutrition data
 * @param productName Product name from Open Food Facts
 * @returns Swedish nutrition data if found
 */
export async function findSwedishNutrition(
  productName: string
): Promise<SwedishNutritionData | null> {
  try {
    // Extract main food type from product name
    // Remove brand names, sizes, and common words
    const cleanName = productName
      .toLowerCase()
      .replace(/\d+\s*(ml|l|g|kg|st|pack)/gi, '') // Remove sizes
      .replace(/ekologisk|organic|eko/gi, '') // Remove organic labels
      .trim()
      .split(/\s+/)
      .slice(0, 2) // Take first 2 words
      .join(' ');

    const results = await searchSwedishFood(cleanName);

    if (results.length === 0) {
      return null;
    }

    // Get nutrition data for the best match (first result)
    return await getSwedishNutrition(results[0].nummer);
  } catch (error) {
    console.error('Error finding Swedish nutrition:', error);
    return null;
  }
}
