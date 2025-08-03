'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download, FileText, Table, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportDataProps {
  startDate: Date
  endDate: Date
  onClose: () => void
}

const DATA_TYPES = {
  weight: 'Weight Records',
  fasting: 'Fasting Sessions',
  health: 'Health Metrics',
  all: 'All Data',
}

const EXPORT_FORMATS = {
  csv: { label: 'CSV', icon: Table, description: 'Spreadsheet format' },
  json: { label: 'JSON', icon: FileText, description: 'Raw data format' },
  pdf: { label: 'PDF Report', icon: FileText, description: 'Formatted report' },
}

export function ExportData({ startDate, endDate, onClose }: ExportDataProps) {
  const { toast } = useToast()
  const [selectedFormat, setSelectedFormat] = useState('csv')
  const [selectedDataTypes, setSelectedDataTypes] = useState(['all'])
  const [exporting, setExporting] = useState(false)

  const handleDataTypeToggle = (dataType: string) => {
    if (dataType === 'all') {
      setSelectedDataTypes(['all'])
    } else {
      if (selectedDataTypes.includes('all')) {
        setSelectedDataTypes([dataType])
      } else {
        setSelectedDataTypes(prev => 
          prev.includes(dataType) 
            ? prev.filter(t => t !== dataType)
            : [...prev, dataType]
        )
      }
    }
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generatePDFReport = async (data: any) => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 20
    let yPosition = margin

    // Title
    pdf.setFontSize(20)
    pdf.text('Health Tracker Analytics Report', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Date range
    pdf.setFontSize(12)
    pdf.text(
      `Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    )
    yPosition += 20

    // Summary section
    pdf.setFontSize(16)
    pdf.text('Summary', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    if (data.summary) {
      pdf.text(`• Total Weight Records: ${data.summary.weightRecords}`, margin + 5, yPosition)
      yPosition += 7
      pdf.text(`• Total Fasting Hours: ${data.summary.fastingHours.toFixed(0)}`, margin + 5, yPosition)
      yPosition += 7
      pdf.text(`• Average Weight: ${data.summary.avgWeight.toFixed(1)} kg`, margin + 5, yPosition)
      yPosition += 7
      pdf.text(`• Weight Change: ${data.summary.weightChange.toFixed(1)} kg`, margin + 5, yPosition)
      yPosition += 15
    }

    // Weight records section
    if (data.weight && data.weight.length > 0) {
      pdf.setFontSize(16)
      pdf.text('Weight Records', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      data.weight.slice(0, 10).forEach((record: any) => {
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = margin
        }
        pdf.text(
          `${format(new Date(record.recordedAt), 'MMM dd, yyyy')}: ${record.weight.toFixed(1)} kg`,
          margin + 5,
          yPosition
        )
        yPosition += 6
      })
      
      if (data.weight.length > 10) {
        pdf.text(`... and ${data.weight.length - 10} more records`, margin + 5, yPosition)
        yPosition += 10
      }
    }

    // Generate charts as images (if needed)
    // This would require rendering charts to canvas first

    return pdf
  }

  const handleExport = async () => {
    setExporting(true)

    try {
      const dataTypes = selectedDataTypes.includes('all') 
        ? ['weight', 'fasting', 'health'] 
        : selectedDataTypes

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dataTypes: dataTypes.join(','),
        format: selectedFormat,
      })

      const response = await fetch(`/api/analytics/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const data = await response.json()

      if (data) {
        const dateStr = format(new Date(), 'yyyy-MM-dd')
        
        switch (selectedFormat) {
          case 'csv':
            downloadFile(data.csv, `health-data-${dateStr}.csv`, 'text/csv')
            break
          
          case 'json':
            downloadFile(
              JSON.stringify(data, null, 2),
              `health-data-${dateStr}.json`,
              'application/json'
            )
            break
          
          case 'pdf':
            const pdf = await generatePDFReport(data)
            pdf.save(`health-report-${dateStr}.pdf`)
            break
        }

        toast({
          title: 'Export successful',
          description: `Your data has been exported as ${selectedFormat.toUpperCase()}`,
        })
        onClose()
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics Data
          </DialogTitle>
          <DialogDescription>
            Export your health tracking data for the selected period
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Display */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">Date Range</p>
            <p className="text-sm text-muted-foreground">
              {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
            </p>
          </div>

          {/* Data Types Selection */}
          <div className="space-y-3">
            <Label>Select Data to Export</Label>
            <div className="space-y-2">
              {Object.entries(DATA_TYPES).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={selectedDataTypes.includes(key)}
                    onCheckedChange={() => handleDataTypeToggle(key)}
                  />
                  <Label
                    htmlFor={key}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat}>
              {Object.entries(EXPORT_FORMATS).map(([key, format]) => (
                <div key={key} className="flex items-center space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <format.icon className="h-4 w-4" />
                      <span className="font-medium">{format.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format.description}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={exporting || selectedDataTypes.length === 0}
          >
            {exporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}