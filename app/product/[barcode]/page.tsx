import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ProductCard } from '@/components/product-card';
import { searchByBarcode } from '@/lib/api/openfoodfacts';

interface ProductPageProps {
  params: Promise<{
    barcode: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { barcode } = await params;
  const product = await searchByBarcode(barcode);

  if (!product) {
    return {
      title: 'Produkt ej funnen',
    };
  }

  return {
    title: `${product.name} - Matscanner`,
    description: `Eco-Score: ${product.ecoscore_grade?.toUpperCase() || 'Ej betygsatt'}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { barcode } = await params;

  try {
    const product = await searchByBarcode(barcode);

    if (!product) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <ProductCard product={product} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    notFound();
  }
}
