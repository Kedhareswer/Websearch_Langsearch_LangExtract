import '../styles/globals.css'
import { useState } from 'react'
import { LoadingScreen } from '../components/ui/loading-screen'
import type { AppProps } from 'next/app'
import { Plus_Jakarta_Sans } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400','500','600','700','800'] })

export default function App({ Component, pageProps }: AppProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={plusJakarta.className}>
      <LoadingScreen 
        duration={5000} 
        onComplete={() => setIsLoaded(true)}
      >
        <Component {...pageProps} />
      </LoadingScreen>
    </div>
  )
}
