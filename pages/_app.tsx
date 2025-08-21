import '../styles/globals.css'
import { useState } from 'react'
import { LoadingScreen } from '../components/ui/loading-screen'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <LoadingScreen 
      duration={5000} 
      onComplete={() => setIsLoaded(true)}
    >
      <Component {...pageProps} />
    </LoadingScreen>
  )
}
