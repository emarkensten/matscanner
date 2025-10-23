'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Scanner } from '@/components/scanner';
import { SearchBar } from '@/components/search-bar';
import { ProductCard } from '@/components/product-card';
import { searchByTerm, searchByBarcode, enrichProductWithSwedishData, Product } from '@/lib/api/openfoodfacts';

export default function Home() {
  const [scannerActive, setScannerActive] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const handleScan = useCallback(
    async (barcode: string) => {
      setScannerActive(false);
      setSearchError(null);
      setLoadingProduct(true);

      try {
        const product = await searchByBarcode(barcode);
        if (product) {
          setSelectedProduct(product);
          setDrawerOpen(true);
        } else {
          setSearchError('Produkt inte funnen. Försök igen.');
        }
      } catch {
        setSearchError('Kunde inte hämta produktdata.');
      } finally {
        setLoadingProduct(false);
      }
    },
    []
  );

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const results = await searchByTerm(query);
      if (results.length === 0) {
        setSearchError('Inga produkter hittades. Försök med en annan sökning.');
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      setSearchError('Sökningen misslyckades. Försök igen senare.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectProduct = async (product: Product) => {
    setDrawerOpen(true);
    setLoadingProduct(true);
    setSelectedProduct(product);

    // Lazy load Swedish nutrition data when product is opened
    try {
      const enrichedProduct = await enrichProductWithSwedishData(product);
      setSelectedProduct(enrichedProduct);
    } catch (error) {
      console.error('Failed to enrich product with Swedish data:', error);
      // Keep original product if enrichment fails
    } finally {
      setLoadingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-900 mb-2">Matscanner</h1>
          <p className="text-gray-600">Klimatsmart matkoll</p>
        </div>

        {/* Scanner Section */}
        {!showSearch ? (
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle>Scanna streckkod</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!scannerActive ? (
                <Button
                  onClick={() => setScannerActive(true)}
                  size="lg"
                  className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
                >
                  Starta kamera
                </Button>
              ) : (
                <Scanner
                  onScan={handleScan}
                  isActive={scannerActive}
                />
              )}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">eller</span>
                </div>
              </div>

              <Button
                onClick={() => setShowSearch(true)}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Sök manuellt
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sök efter produkt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchBar onSearch={handleSearch} isLoading={isSearching} />

              {searchError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-900">
                    {searchError}
                  </AlertDescription>
                </Alert>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-gray-700">
                    Sökresultat ({searchResults.length})
                  </p>
                  {searchResults.map((product) => (
                    <button
                      key={product.barcode}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.brand}</p>
                    </button>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setShowSearch(false)}
                variant="outline"
                className="w-full"
              >
                Tillbaka
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Om Eco-Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700">
              Eco-Score är ett miljöbetyg för matvaror från A (bäst) till E
              (sämst). Det baseras på miljöpåverkan under produktionens hela
              livscykel.
            </p>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <div className="w-full h-10 bg-green-600 rounded flex items-center justify-center text-white font-bold mb-1">
                  A
                </div>
                <p className="text-xs text-gray-600">Bäst</p>
              </div>
              <div className="text-center">
                <div
                  className="w-full h-10 rounded flex items-center justify-center text-white font-bold mb-1"
                  style={{ backgroundColor: '#55CC33' }}
                >
                  B
                </div>
                <p className="text-xs text-gray-600">Bra</p>
              </div>
              <div className="text-center">
                <div className="w-full h-10 bg-yellow-400 rounded flex items-center justify-center text-black font-bold mb-1">
                  C
                </div>
                <p className="text-xs text-gray-600">Medel</p>
              </div>
              <div className="text-center">
                <div className="w-full h-10 bg-orange-500 rounded flex items-center justify-center text-white font-bold mb-1">
                  D
                </div>
                <p className="text-xs text-gray-600">Dålig</p>
              </div>
              <div className="text-center">
                <div className="w-full h-10 bg-red-600 rounded flex items-center justify-center text-white font-bold mb-1">
                  E
                </div>
                <p className="text-xs text-gray-600">Sämst</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Produktinformation</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">
            {loadingProduct ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-600">Laddar produkt...</p>
              </div>
            ) : selectedProduct ? (
              <ProductCard
                product={selectedProduct}
                onClose={() => setDrawerOpen(false)}
              />
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
