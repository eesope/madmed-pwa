import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>

      <div className="p-6 text-2xl font-semibold text-red-500">MadMed</div>

        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

    </>

  )
}

export default App
