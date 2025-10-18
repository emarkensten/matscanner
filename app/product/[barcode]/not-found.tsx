import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Produkt inte funnen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Tyvärr kunde vi inte hitta produkten med denna streckkod i databasen.
              Försök med en annan streckkod eller sök efter produktnamnet istället.
            </p>
            <Link href="/">
              <Button className="w-full">Tillbaka till start</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
