'use client'

import { useState } from 'react'
import { 
  Heart, 
  Activity, 
  Droplets, 
  Moon, 
  Battery, 
  Plus,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHealthMetricsStore } from '@/store/health-metrics-store'
import { HealthMetricRanges, isInNormalRange } from '@/lib/utils/health-calculations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MetricInput {
  type: string
  label: string
  icon: React.ReactNode
  unit: string
  placeholder: string
  step?: string
  min?: number
  max?: number
  helperText?: string
}

const commonMetrics: MetricInput[] = [
  {
    type: 'blood_pressure',
    label: 'Blood Pressure',
    icon: <Heart className="h-4 w-4" />,
    unit: 'mmHg',
    placeholder: '120/80',
    helperText: 'Format: systolic/diastolic'
  },
  {
    type: 'heart_rate',
    label: 'Heart Rate',
    icon: <Activity className="h-4 w-4" />,
    unit: 'bpm',
    placeholder: '72',
    step: '1',
    min: 40,
    max: 200
  },
  {
    type: 'blood_glucose',
    label: 'Blood Glucose',
    icon: <Droplets className="h-4 w-4" />,
    unit: 'mg/dL',
    placeholder: '95',
    step: '1',
    min: 20,
    max: 600
  },
  {
    type: 'sleep_hours',
    label: 'Sleep Hours',
    icon: <Moon className="h-4 w-4" />,
    unit: 'hours',
    placeholder: '7.5',
    step: '0.5',
    min: 0,
    max: 24
  },
  {
    type: 'water_intake',
    label: 'Water Intake',
    icon: <Droplets className="h-4 w-4" />,
    unit: 'litres',
    placeholder: '2.5',
    step: '0.1',
    min: 0,
    max: 10
  },
  {
    type: 'energy_level',
    label: 'Energy Level',
    icon: <Battery className="h-4 w-4" />,
    unit: '1-10',
    placeholder: '7',
    step: '1',
    min: 1,
    max: 10
  }
]

export function HealthMetricsForm() {
  const { addMetric, isLoading } = useHealthMetricsStore()
  const [activeTab, setActiveTab] = useState('common')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [customMetric, setCustomMetric] = useState({
    name: '',
    value: '',
    unit: '',
    notes: ''
  })

  const handleSubmit = async (metricType: string, unit: string) => {
    const value = formData[metricType]
    if (!value) {
      toast.error('Please enter a value')
      return
    }

    try {
      let processedValue: any = value

      // Special handling for blood pressure
      if (metricType === 'blood_pressure') {
        const parts = value.split('/')
        if (parts.length !== 2) {
          toast.error('Invalid blood pressure format. Use: systolic/diastolic')
          return
        }
        processedValue = {
          systolic: parseInt(parts[0]),
          diastolic: parseInt(parts[1])
        }
        
        if (isNaN(processedValue.systolic) || isNaN(processedValue.diastolic)) {
          toast.error('Invalid blood pressure values')
          return
        }
      } else {
        processedValue = parseFloat(value)
        if (isNaN(processedValue)) {
          toast.error('Invalid numeric value')
          return
        }
      }

      await addMetric(metricType, processedValue, unit, notes[metricType])
      
      // Clear form data for this metric
      setFormData(prev => ({ ...prev, [metricType]: '' }))
      setNotes(prev => ({ ...prev, [metricType]: '' }))
      
      toast.success(`${metricType.replace(/_/g, ' ')} recorded successfully`)
    } catch (error) {
      toast.error('Failed to record metric')
    }
  }

  const handleCustomSubmit = async () => {
    if (!customMetric.name || !customMetric.value) {
      toast.error('Please enter metric name and value')
      return
    }

    try {
      await addMetric(
        customMetric.name.toLowerCase().replace(/\s+/g, '_'),
        customMetric.value,
        customMetric.unit,
        customMetric.notes
      )
      
      setCustomMetric({ name: '', value: '', unit: '', notes: '' })
      toast.success('Custom metric recorded successfully')
    } catch (error) {
      toast.error('Failed to record custom metric')
    }
  }

  const getValueStatus = (metricType: string, value: string) => {
    if (!value) return null

    const numValue = metricType === 'blood_pressure' 
      ? parseInt(value.split('/')[0]) // Use systolic for range check
      : parseFloat(value)

    if (isNaN(numValue)) return null

    const isNormal = isInNormalRange(numValue, metricType as keyof typeof HealthMetricRanges)
    return isNormal ? 'normal' : 'warning'
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Health Metrics</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="common">Common Metrics</TabsTrigger>
          <TabsTrigger value="custom">Custom Metric</TabsTrigger>
        </TabsList>

        <TabsContent value="common" className="space-y-4 mt-4">
          {commonMetrics.map((metric) => {
            const status = getValueStatus(metric.type, formData[metric.type] || '')
            
            return (
              <div key={metric.type} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label 
                    htmlFor={metric.type} 
                    className="flex items-center gap-2 text-base"
                  >
                    {metric.icon}
                    {metric.label}
                  </Label>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    id={metric.type}
                    type={metric.type === 'blood_pressure' ? 'text' : 'number'}
                    value={formData[metric.type] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [metric.type]: e.target.value
                    }))}
                    placeholder={metric.placeholder}
                    step={metric.step}
                    min={metric.min}
                    max={metric.max}
                    className={cn(
                      status === 'warning' && 'border-yellow-500',
                      status === 'normal' && 'border-green-500'
                    )}
                  />
                  <Button
                    onClick={() => handleSubmit(metric.type, metric.unit)}
                    disabled={isLoading || !formData[metric.type]}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {metric.helperText && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {metric.helperText}
                  </p>
                )}

                <Textarea
                  placeholder="Optional notes..."
                  value={notes[metric.type] || ''}
                  onChange={(e) => setNotes(prev => ({
                    ...prev,
                    [metric.type]: e.target.value
                  }))}
                  rows={2}
                  className="text-sm"
                />
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-4">
          <div className="space-y-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="custom-name">Metric Name</Label>
              <Input
                id="custom-name"
                value={customMetric.name}
                onChange={(e) => setCustomMetric(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="E.g., Body Temperature"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-value">Value</Label>
                <Input
                  id="custom-value"
                  value={customMetric.value}
                  onChange={(e) => setCustomMetric(prev => ({
                    ...prev,
                    value: e.target.value
                  }))}
                  placeholder="E.g., 36.5"
                />
              </div>

              <div>
                <Label htmlFor="custom-unit">Unit (optional)</Label>
                <Input
                  id="custom-unit"
                  value={customMetric.unit}
                  onChange={(e) => setCustomMetric(prev => ({
                    ...prev,
                    unit: e.target.value
                  }))}
                  placeholder="E.g., °C"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="custom-notes">Notes (optional)</Label>
              <Textarea
                id="custom-notes"
                value={customMetric.notes}
                onChange={(e) => setCustomMetric(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            <Button
              onClick={handleCustomSubmit}
              disabled={isLoading || !customMetric.name || !customMetric.value}
              className="w-full"
            >
              Record Custom Metric
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}