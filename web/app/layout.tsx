import type React from "react"
import type {Metadata} from "next"
import "./globals.css"
import {AudioProvider} from "./providers/audio-provider"
import {AudioPlayer} from "@/components/audio-player"
import {Navigation} from "@/components/navigation"

export const metadata: Metadata = {
    title: "RadioAlice",
    description: "Your premium music streaming experience",
    generator: 'v0.app'
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className={`font-sans antialiased`}>
        <AudioProvider>
            <div className="flex min-h-screen flex-col bg-background">
                <Navigation/>
                <main className="flex-1">{children}</main>
                <AudioPlayer/>
            </div>
        </AudioProvider>
        </body>
        </html>
    )
}
