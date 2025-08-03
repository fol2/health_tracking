"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowRight, User, Target, Settings } from "lucide-react"
import { toast } from "sonner"

const profileSchema = z.object({
  height: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Height must be a positive number",
  }),
  targetWeight: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Target weight must be a positive number",
  }),
  unitsPreference: z.enum(["metric", "imperial"]),
  dateOfBirth: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfileSetupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basics")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      height: "",
      targetWeight: "",
      unitsPreference: "metric",
      dateOfBirth: "",
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          height: parseFloat(data.height),
          targetWeight: parseFloat(data.targetWeight),
          unitsPreference: data.unitsPreference,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create profile")
      }

      toast.success("Profile created successfully!")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Failed to create profile. Please try again.")
      console.error("Profile creation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextTab = () => {
    if (activeTab === "basics") setActiveTab("goals")
    else if (activeTab === "goals") setActiveTab("preferences")
  }

  const prevTab = () => {
    if (activeTab === "preferences") setActiveTab("goals")
    else if (activeTab === "goals") setActiveTab("basics")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to Health Tracker</CardTitle>
          <CardDescription>
            Let's set up your profile to personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basics" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Basics</span>
                  </TabsTrigger>
                  <TabsTrigger value="goals" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="hidden sm:inline">Goals</span>
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Preferences</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basics" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Tell us a bit about yourself
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Helps us calculate age-appropriate recommendations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              placeholder={form.watch("unitsPreference") === "metric" ? "170" : "67"}
                              {...field} 
                            />
                            <span className="text-sm text-muted-foreground">
                              {form.watch("unitsPreference") === "metric" ? "cm" : "inches"}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your height for BMI calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="goals" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Your Goals</h3>
                    <p className="text-sm text-muted-foreground">
                      What would you like to achieve?
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="targetWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Weight</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              placeholder={form.watch("unitsPreference") === "metric" ? "70" : "154"}
                              {...field} 
                            />
                            <span className="text-sm text-muted-foreground">
                              {form.watch("unitsPreference") === "metric" ? "kg" : "lbs"}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your weight goal for tracking progress
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize your experience
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="unitsPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit System</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit system" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                            <SelectItem value="imperial">Imperial (lbs, inches)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your preferred measurement system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevTab}
                  disabled={activeTab === "basics"}
                >
                  Previous
                </Button>
                
                {activeTab !== "preferences" ? (
                  <Button type="button" onClick={nextTab}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Profile..." : "Complete Setup"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}