import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Landing from '@/pages/Landing'
import Investigate from '@/pages/Investigate'
import Results from '@/pages/Results'
import About from '@/pages/About'
import { AnalysisProvider } from '@/lib/AnalysisContext'

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <AnalysisProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="investigate" element={<Investigate />} />
          <Route path="results" element={<Results />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </AnalysisProvider>
  )
}
