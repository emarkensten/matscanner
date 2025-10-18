'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { EcoScoreBadge } from './eco-score-badge';
import { Product } from '@/lib/api/openfoodfacts';

interface ProductCardProps {
  product: Product;
  onCompare?: (product: Product) => void;
  isInComparison?: boolean;
}

export function ProductCard({
  product,
  onCompare,
  isInComparison = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const getNutriScoreColor = (
    grade?: 'a' | 'b' | 'c' | 'd' | 'e' | null
  ) => {
    if (!grade) return 'bg-gray-100';
    const colors: Record<'a' | 'b' | 'c' | 'd' | 'e', string> = {
      a: 'bg-green-100 text-green-900',
      b: 'bg-green-50 text-green-800',
      c: 'bg-yellow-100 text-yellow-900',
      d: 'bg-orange-100 text-orange-900',
      e: 'bg-red-100 text-red-900',
    };
    return colors[grade];
  };

  return (
    <Card className="w-full overflow-hidden">
      {/* Hero Image */}
      {product.image_url && !imageError ? (
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            priority
          />
        </div>
      ) : (
        <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
          <p className="text-gray-400">Ingen bild tillgänglig</p>
        </div>
      )}

      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-xl mb-2">{product.name}</CardTitle>
          {product.brand && (
            <p className="text-sm text-gray-600">Märke: {product.brand}</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {product.ecoscore_grade && (
            <Badge className="bg-green-600 text-white">
              Eco-Score {product.ecoscore_grade.toUpperCase()}
            </Badge>
          )}
          {product.nutriscore_grade && (
            <Badge className={getNutriScoreColor(product.nutriscore_grade)}>
              Nutri-Score {product.nutriscore_grade.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Eco-Score Details */}
        <div className="space-y-2">
          <EcoScoreBadge
            grade={product.ecoscore_grade}
            score={product.ecoscore_score}
          />
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="nutrition">Näring</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredienser</TabsTrigger>
            <TabsTrigger value="environment">Miljö</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3">
            {product.allergens && (
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">
                  Allergener
                </p>
                <p className="text-sm text-gray-600">{product.allergens}</p>
              </div>
            )}
            {product.packaging && (
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">
                  Förpackning
                </p>
                <p className="text-sm text-gray-600">{product.packaging}</p>
              </div>
            )}
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-3">
            {product.nutriments ? (
              <div className="grid grid-cols-2 gap-3">
                {product.nutriments.energy_100g !== undefined && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Energi</p>
                    <p className="font-semibold">
                      {product.nutriments.energy_100g} kcal
                    </p>
                  </div>
                )}
                {product.nutriments.proteins_100g !== undefined && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Protein</p>
                    <p className="font-semibold">
                      {product.nutriments.proteins_100g}g
                    </p>
                  </div>
                )}
                {product.nutriments.fat_100g !== undefined && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Fett</p>
                    <p className="font-semibold">
                      {product.nutriments.fat_100g}g
                    </p>
                  </div>
                )}
                {product.nutriments.carbohydrates_100g !== undefined && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Kolhydrater</p>
                    <p className="font-semibold">
                      {product.nutriments.carbohydrates_100g}g
                    </p>
                  </div>
                )}
                {product.nutriments.sugars_100g !== undefined && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Socker</p>
                    <p className="font-semibold">
                      {product.nutriments.sugars_100g}g
                    </p>
                  </div>
                )}
                {product.nutriments.salt_100g !== undefined && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Salt</p>
                    <p className="font-semibold">
                      {product.nutriments.salt_100g}g
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Näringsdata ej tillgänglig</p>
            )}
          </TabsContent>

          {/* Ingredients Tab */}
          <TabsContent value="ingredients" className="space-y-3">
            {product.ingredients_text ? (
              <p className="text-sm text-gray-700 leading-relaxed">
                {product.ingredients_text}
              </p>
            ) : (
              <p className="text-sm text-gray-600">Ingredienser ej tillgängliga</p>
            )}
          </TabsContent>

          {/* Environment Tab */}
          <TabsContent value="environment" className="space-y-3">
            {product.carbon_footprint ? (
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">
                  Koldioxidutsläpp
                </p>
                <p className="text-sm text-gray-600">
                  {product.carbon_footprint} g CO2
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Miljödata ej tillgänglig
              </p>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Scanna ny
            </Button>
          </Link>
          {onCompare && (
            <Button
              onClick={() => onCompare(product)}
              disabled={isInComparison}
              className="flex-1"
            >
              {isInComparison ? 'I jämförelse' : 'Jämför'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
