'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Product } from '@/lib/api/openfoodfacts';

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Hämta produkter från localStorage
    const stored = localStorage.getItem('matscanner_comparison');
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored products:', error);
      }
    }
  }, []);

  const handleRemove = (barcode: string) => {
    const updated = products.filter((p) => p.barcode !== barcode);
    setProducts(updated);
    localStorage.setItem('matscanner_comparison', JSON.stringify(updated));
  };

  const handleClear = () => {
    setProducts([]);
    localStorage.removeItem('matscanner_comparison');
  };

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Jämförelse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Ingen produkter att jämföra ännu.</p>
              <Link href="/">
                <Button className="w-full">Tillbaka till start</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Hitta produkten med bästa Eco-Score
  const bestProduct = products.reduce((best, current) => {
    if (!best.ecoscore_grade) return current;
    if (!current.ecoscore_grade) return best;

    const gradeValue: Record<'a' | 'b' | 'c' | 'd' | 'e', number> = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
    };

    return gradeValue[current.ecoscore_grade as keyof typeof gradeValue] <
      gradeValue[best.ecoscore_grade as keyof typeof gradeValue]
      ? current
      : best;
  });

  const getEcoScoreColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100';
    const colors: Record<string, string> = {
      a: 'bg-green-600 text-white',
      b: '#55CC33',
      c: 'bg-yellow-400 text-black',
      d: 'bg-orange-500 text-white',
      e: 'bg-red-600 text-white',
    };
    return colors[grade.toLowerCase()] || 'bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jämförelse</h1>
          <p className="text-gray-600">
            Jämför klimatpåverkan mellan {products.length} produkter
          </p>
        </div>

        {/* Comparison Grid */}
        <div
          className={`grid gap-4 mb-6 ${
            products.length === 1
              ? 'grid-cols-1'
              : products.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
          }`}
        >
          {products.map((product) => (
            <Card
              key={product.barcode}
              className={`overflow-hidden ${
                product === bestProduct ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {product.name}
                  </CardTitle>
                  {product.brand && (
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Eco-Score */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Eco-Score
                  </p>
                  {product.ecoscore_grade ? (
                    <div className="flex items-center gap-2">
                      <Badge className={`${getEcoScoreColor(product.ecoscore_grade)} text-lg font-bold px-3 py-1`}>
                        {product.ecoscore_grade.toUpperCase()}
                      </Badge>
                      {product.ecoscore_score && (
                        <span className="text-sm text-gray-600">
                          {product.ecoscore_score}/100
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline">Ej betygsatt</Badge>
                  )}
                </div>

                {product === bestProduct && (
                  <>
                    <Separator />
                    <Badge className="w-full justify-center bg-green-100 text-green-800">
                      Bästa val
                    </Badge>
                  </>
                )}

                {/* Nutri-Score */}
                {product.nutriscore_grade && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">
                        Nutri-Score
                      </p>
                      <Badge
                        variant="outline"
                        className="text-sm"
                      >
                        {product.nutriscore_grade.toUpperCase()}
                      </Badge>
                    </div>
                  </>
                )}

                {/* CO2 */}
                {product.carbon_footprint && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">
                        CO2-utsläpp
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.carbon_footprint} g
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <Button
                  onClick={() => handleRemove(product.barcode)}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:bg-red-50"
                >
                  Ta bort
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Tillbaka
            </Button>
          </Link>
          <Button
            onClick={handleClear}
            variant="outline"
            className="text-red-600 hover:bg-red-50"
          >
            Rensa alla
          </Button>
        </div>
      </div>
    </div>
  );
}
