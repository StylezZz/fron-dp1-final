import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider" 
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "GLP Distribution Logistics",
  description: "GLP Distribution Logistics Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SidebarProvider defaultOpen={false}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center p-2 border-b">
                  <SidebarTrigger />
                </div>
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}