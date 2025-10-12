import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppRouter } from './router'
function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  )
}

export default App

