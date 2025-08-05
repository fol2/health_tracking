import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NutritionData } from '@/types/meal'

interface NutritionField {
  key: keyof NutritionData
  label: string
  unit?: string
  required?: boolean
  step?: string
  min?: string
}

const NUTRITION_FIELDS: NutritionField[] = [
  { key: 'calories', label: 'Calories', required: true, min: '0' },
  { key: 'protein', label: 'Protein', unit: 'g', required: true, min: '0', step: '0.1' },
  { key: 'carbs', label: 'Carbs', unit: 'g', required: true, min: '0', step: '0.1' },
  { key: 'fat', label: 'Fat', unit: 'g', required: true, min: '0', step: '0.1' },
  { key: 'fiber', label: 'Fiber', unit: 'g', min: '0', step: '0.1' },
  { key: 'sugar', label: 'Sugar', unit: 'g', min: '0', step: '0.1' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', min: '0' }
]

interface NutritionInputsProps {
  values: Partial<NutritionData>
  onChange: (field: keyof NutritionData, value: string) => void
  columns?: 2 | 3 | 4
  onlyRequired?: boolean
}

export function NutritionInputs({ 
  values, 
  onChange, 
  columns = 4,
  onlyRequired = false 
}: NutritionInputsProps) {
  const fields = onlyRequired 
    ? NUTRITION_FIELDS.filter(f => f.required)
    : NUTRITION_FIELDS

  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  }[columns]

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Nutrition Facts</h3>
      <div className={`grid ${gridClass} gap-4`}>
        {fields.map(({ key, label, unit, required, step, min }) => (
          <div key={key}>
            <Label htmlFor={key}>
              {label} {unit && `(${unit})`} {required && '*'}
            </Label>
            <Input
              id={key}
              type="number"
              value={values[key]?.toString() || ''}
              onChange={(e) => onChange(key, e.target.value)}
              min={min}
              step={step}
              required={required}
            />
          </div>
        ))}
      </div>
    </div>
  )
}