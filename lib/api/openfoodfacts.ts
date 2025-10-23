import { findSwedishNutrition, SwedishNutritionData } from './livsmedelsverket';

export interface Nutriments {
  energy_100g?: number;
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  salt_100g?: number;
  fiber_100g?: number;
  saturated_fat_100g?: number;
  calcium_100g?: number;
  iron_100g?: number;
  vitamin_c_100g?: number;
  vitamin_d_100g?: number;
}

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  image_url?: string;
  ecoscore_grade?: 'a' | 'b' | 'c' | 'd' | 'e' | null;
  ecoscore_score?: number;
  nutriscore_grade?: 'a' | 'b' | 'c' | 'd' | 'e' | null;
  nutriments?: Nutriments;
  ingredients_text?: string;
  allergens?: string;
  carbon_footprint?: string;
  packaging?: string;
  swedish_nutrition?: SwedishNutritionData; // Swedish nutrition data from Livsmedelsverket
  data_source?: 'openfoodfacts' | 'swedish' | 'combined';
}

interface OpenFoodFactsProduct {
  code?: string;
  barcode?: string;
  product_name_sv?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  ecoscore_grade?: string;
  ecoscore_score?: number;
  nutriscore_grade?: string;
  nutriments?: Record<string, number | string>;
  ingredients_text_sv?: string;
  ingredients_text?: string;
  allergens?: string;
  carbon_footprint_from_known_ingredients_product?: string;
  packaging?: string;
}

interface SearchResult {
  products: OpenFoodFactsProduct[];
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCache(key: string): Product | null {
  if (typeof window === 'undefined') return null;

  const cached = localStorage.getItem(`matscanner_${key}`);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(`matscanner_${key}`);
    return null;
  }

  return data;
}

function setCache(key: string, data: Product): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(
    `matscanner_${key}`,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

function normalizeProduct(
  raw: OpenFoodFactsProduct,
  barcode: string
): Product {
  const name = raw.product_name_sv || raw.product_name || 'Okänd produkt';

  return {
    barcode,
    name,
    brand: raw.brands,
    image_url: raw.image_url,
    ecoscore_grade: (raw.ecoscore_grade?.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e' | null) || null,
    ecoscore_score: raw.ecoscore_score,
    nutriscore_grade: (raw.nutriscore_grade?.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e' | null) || null,
    nutriments: {
      energy_100g: raw.nutriments?.energy_100g as number,
      proteins_100g: raw.nutriments?.proteins_100g as number,
      fat_100g: raw.nutriments?.fat_100g as number,
      carbohydrates_100g: raw.nutriments?.carbohydrates_100g as number,
      sugars_100g: raw.nutriments?.sugars_100g as number,
      salt_100g: raw.nutriments?.salt_100g as number,
      fiber_100g: raw.nutriments?.fiber_100g as number,
      saturated_fat_100g: raw.nutriments?.['saturated-fat_100g'] as number,
      calcium_100g: raw.nutriments?.calcium_100g as number,
      iron_100g: raw.nutriments?.iron_100g as number,
      vitamin_c_100g: raw.nutriments?.['vitamin-c_100g'] as number,
      vitamin_d_100g: raw.nutriments?.['vitamin-d_100g'] as number,
    },
    ingredients_text: raw.ingredients_text_sv || raw.ingredients_text,
    allergens: raw.allergens,
    carbon_footprint: raw.carbon_footprint_from_known_ingredients_product?.toString(),
    packaging: raw.packaging,
    data_source: 'openfoodfacts',
  };
}

/**
 * Enrich product with Swedish nutrition data from Livsmedelsverket
 * This combines data from both Open Food Facts and Livsmedelsverket
 */
async function enrichWithSwedishData(product: Product): Promise<Product> {
  try {
    const swedishData = await findSwedishNutrition(product.name);

    if (!swedishData) {
      return product;
    }

    // Merge Swedish nutrition data with existing nutriments
    // Swedish data is prioritized for Swedish products
    const enrichedNutriments: Nutriments = {
      ...product.nutriments,
      // Convert Swedish data (per 100g) to match our format
      energy_100g: swedishData.energy_kcal || product.nutriments?.energy_100g,
      proteins_100g: swedishData.protein_g || product.nutriments?.proteins_100g,
      fat_100g: swedishData.fat_g || product.nutriments?.fat_100g,
      carbohydrates_100g: swedishData.carbs_g || product.nutriments?.carbohydrates_100g,
      sugars_100g: swedishData.sugar_g || product.nutriments?.sugars_100g,
      salt_100g: swedishData.salt_g || product.nutriments?.salt_100g,
      fiber_100g: swedishData.fiber_g || product.nutriments?.fiber_100g,
      saturated_fat_100g: swedishData.saturated_fat_g || product.nutriments?.saturated_fat_100g,
      // Additional nutrients from Swedish data
      calcium_100g: swedishData.calcium_mg ? swedishData.calcium_mg / 1000 : product.nutriments?.calcium_100g,
      iron_100g: swedishData.iron_mg ? swedishData.iron_mg / 1000 : product.nutriments?.iron_100g,
      vitamin_c_100g: swedishData.vitamin_c_mg ? swedishData.vitamin_c_mg / 1000 : product.nutriments?.vitamin_c_100g,
      vitamin_d_100g: swedishData.vitamin_d_ug ? swedishData.vitamin_d_ug / 1000000 : product.nutriments?.vitamin_d_100g,
    };

    return {
      ...product,
      nutriments: enrichedNutriments,
      swedish_nutrition: swedishData,
      data_source: 'combined',
    };
  } catch (error) {
    console.error('Error enriching with Swedish data:', error);
    return product;
  }
}

export async function searchByBarcode(barcode: string): Promise<Product | null> {
  const cached = getCache(barcode);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v3/product/${barcode}`
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // V3 API returns { product: {...}, status: "success" }
    if (!data.product) {
      return null;
    }

    let product = normalizeProduct(data.product, barcode);

    // Enrich with Swedish nutrition data
    product = await enrichWithSwedishData(product);

    setCache(barcode, product);
    return product;
  } catch (error) {
    console.error('Failed to fetch product by barcode:', error);
    throw error;
  }
}

export async function searchByTerm(
  query: string,
  pageSize: number = 20
): Promise<Product[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&json=1&page_size=${pageSize}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: SearchResult = await response.json();

    if (!data.products || !Array.isArray(data.products)) {
      return [];
    }

    const products = data.products
      .slice(0, 5) // Limit to top 5 results
      .map((raw) => normalizeProduct(raw, raw.code || raw.barcode || ''))
      .filter((p) => p.barcode); // Only include products with barcode

    // Enrich each product with Swedish data
    // Note: We do this sequentially to avoid rate limiting
    const enrichedProducts: Product[] = [];
    for (const product of products) {
      const enriched = await enrichWithSwedishData(product);
      enrichedProducts.push(enriched);
    }

    return enrichedProducts;
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
}
