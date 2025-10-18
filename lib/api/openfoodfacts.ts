export interface Nutriments {
  energy_100g?: number;
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  salt_100g?: number;
  fiber_100g?: number;
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
const API_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

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
    },
    ingredients_text: raw.ingredients_text_sv || raw.ingredients_text,
    allergens: raw.allergens,
    carbon_footprint: raw.carbon_footprint_from_known_ingredients_product?.toString(),
    packaging: raw.packaging,
  };
}

export async function searchByBarcode(barcode: string): Promise<Product | null> {
  const cached = getCache(barcode);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${API_BASE_URL}/product/${barcode}.json`
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = normalizeProduct(data.product, barcode);
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
      `${API_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(
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

    return data.products
      .slice(0, 5) // Limit to top 5 results
      .map((raw) => normalizeProduct(raw, raw.code || raw.barcode || ''))
      .filter((p) => p.barcode); // Only include products with barcode
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
}
