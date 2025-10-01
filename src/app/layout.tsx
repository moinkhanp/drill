import Navbar from '@/components/Navbar'
import './globals.css'
import { cn, constructMetadata } from '@/lib/utils'
import Providers from '@/components/Providers'
import "react-loading-skeleton/dist/skeleton.css"
import "simplebar-react/dist/simplebar.min.css"
import { Toaster } from "@/components/ui/toaster"



export const metadata = constructMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className='light'>
      <Providers>
        <body className={'min-h-screen font-sans antialiased grainy'}>
          <Toaster />
          <Navbar />
          {children}
        </body>
      </Providers>

    </html>
  )
}
