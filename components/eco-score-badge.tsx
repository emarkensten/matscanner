import { Badge } from '@/components/ui/badge';

interface EcoScoreBadgeProps {
  grade?: 'a' | 'b' | 'c' | 'd' | 'e' | null;
  score?: number;
  label?: string;
}

const gradeColors: Record<'a' | 'b' | 'c' | 'd' | 'e', string> = {
  a: 'bg-green-600 text-white',
  b: '#55CC33',
  c: 'bg-yellow-400 text-black',
  d: 'bg-orange-500 text-white',
  e: 'bg-red-600 text-white',
};

const gradeLabels: Record<'a' | 'b' | 'c' | 'd' | 'e', string> = {
  a: 'Mycket bra',
  b: 'Bra',
  c: 'Medel',
  d: 'Dålig',
  e: 'Mycket dålig',
};

export function EcoScoreBadge({
  grade,
  score,
  label = 'Eco-Score',
}: EcoScoreBadgeProps) {
  if (!grade) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <Badge variant="outline" className="text-gray-600">
          Ej betygsatt
        </Badge>
      </div>
    );
  }

  const colors = gradeColors[grade];
  const gradeLabel = gradeLabels[grade];

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <div className="flex items-center gap-2">
        <Badge className={`${colors} text-lg font-bold px-4 py-2`}>
          {grade.toUpperCase()}
        </Badge>
        <span className="text-sm text-gray-600">{gradeLabel}</span>
        {score !== undefined && (
          <span className="text-sm font-semibold text-gray-700">
            ({score}/100)
          </span>
        )}
      </div>
    </div>
  );
}
