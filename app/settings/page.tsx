"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Bell, Moon, Globe, Shield, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { saveAs } from "file-saver"
import { useLanguage, supportedLanguages } from "@/components/language-provider"

export default function SettingsPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [settings, setSettings] = useState({
    theme: "system",
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    dataSharing: false,
    units: "metric",
    language: "en",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      // Fetch user settings
      fetchSettings()
    }
  }, [user, loading, router])

  useEffect(() => {
    // Update theme setting when theme changes
    if (theme) {
      setSettings((prev) => ({ ...prev, theme }))
    }
  }, [theme])

  useEffect(() => {
    // Update language setting when language changes
    if (language) {
      setSettings((prev) => ({ ...prev, language }))
    }
  }, [language])

  const fetchSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings((prevSettings) => ({
          ...prevSettings,
          ...data,
        }))
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "theme") {
      setTheme(value)
    } else if (name === "language") {
      setLanguage(value)
    }
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveSettings = async () => {
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: t("Settings Saved"),
          description: t("Your settings have been successfully updated."),
        })
      } else {
        const data = await response.json()
        setError(data.error || t("Failed to update settings"))
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      setError(t("An error occurred while saving your settings"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: t("Account Deleted"),
          description: t("Your account has been successfully deleted."),
        })
        logout()
        router.push("/")
      } else {
        const data = await response.json()
        setError(data.error || t("Failed to delete account"))
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      setError(t("An error occurred while deleting your account"))
    } finally {
      setIsLoading(false)
      setDeleteAccountDialogOpen(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/export-data")

      if (response.ok) {
        const data = await response.json()

        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(data, null, 2)

        // Create a blob and download it
        const blob = new Blob([jsonString], { type: "application/json" })
        const fileName = `health-data-export-${new Date().toISOString().split("T")[0]}.json`

        saveAs(blob, fileName)

        toast({
          title: t("Data Exported"),
          description: t("Your data has been successfully exported."),
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || t("Failed to export data"))
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      setError(t("An error occurred while exporting your data"))
    } finally {
      setIsExporting(false)
    }
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{t("settings")}</h1>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="appearance">{t("appearance")}</TabsTrigger>
              <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
              <TabsTrigger value="preferences">{t("preferences")}</TabsTrigger>
              <TabsTrigger value="account">{t("account")}</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Moon className="mr-2 h-5 w-5" />
                    {t("appearance")}
                  </CardTitle>
                  <CardDescription>{t("Customize how the application looks and feels")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">{t("theme")}</Label>
                    <Select value={settings.theme} onValueChange={(value) => handleSelectChange("theme", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select theme")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t("light")}</SelectItem>
                        <SelectItem value="dark">{t("dark")}</SelectItem>
                        <SelectItem value="system">{t("system")}</SelectItem>
                        <SelectItem value="retro-gaming">{t("retro-gaming")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isLoading}>
                    {isLoading ? t("saving") : t("saveChanges")}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    {t("notifications")}
                  </CardTitle>
                  <CardDescription>{t("Configure how you want to receive notifications")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">{t("emailNotifications")}</Label>
                      <p className="text-sm text-muted-foreground">{t("Receive notifications via email")}</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSwitchChange("emailNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pushNotifications">{t("pushNotifications")}</Label>
                      <p className="text-sm text-muted-foreground">{t("Receive push notifications on your device")}</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSwitchChange("pushNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weeklyReports">{t("weeklyReports")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("Receive weekly summary reports of your health data")}
                      </p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) => handleSwitchChange("weeklyReports", checked)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isLoading}>
                    {isLoading ? t("saving") : t("saveChanges")}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    {t("preferences")}
                  </CardTitle>
                  <CardDescription>{t("Set your application preferences")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="units">{t("measurementUnits")}</Label>
                    <Select value={settings.units} onValueChange={(value) => handleSelectChange("units", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select units")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">{t("metric")}</SelectItem>
                        <SelectItem value="imperial">{t("imperial")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">{t("language")}</Label>
                    <Select value={settings.language} onValueChange={(value) => handleSelectChange("language", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select language")} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(supportedLanguages).map(([code, langData]) => (
                          <SelectItem key={code} value={code}>
                            {langData.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dataSharing">{t("dataSharing")}</Label>
                      <p className="text-sm text-muted-foreground">{t("dataSharingDesc")}</p>
                    </div>
                    <Switch
                      id="dataSharing"
                      checked={settings.dataSharing}
                      onCheckedChange={(checked) => handleSwitchChange("dataSharing", checked)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isLoading}>
                    {isLoading ? t("saving") : t("saveChanges")}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    {t("account")}
                  </CardTitle>
                  <CardDescription>{t("Manage your account settings")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{t("accountInfo")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("email")}: {user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("name")}: {user.name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{t("exportData")}</h3>
                    <p className="text-sm text-muted-foreground">{t("exportDataDesc")}</p>
                    <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                      {isExporting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          {t("exporting")}
                        </>
                      ) : (
                        t("exportData")
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-destructive">{t("dangerZone")}</h3>
                    <p className="text-sm text-muted-foreground">{t("deleteAccountDesc")}</p>
                    <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("deleteAccount")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("deleteConfirm")}</DialogTitle>
                          <DialogDescription>{t("deleteConfirmDesc")}</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteAccountDialogOpen(false)}>
                            {t("cancel")}
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
                            {isLoading ? t("deleting") : t("deleteAccount")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

