import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Dashboard from './dashboard'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <div className="container">
      
      <Dashboard />
    </div>
     
       
    </>
  )
}

export default App
