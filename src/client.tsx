/// <reference types="vite/client" />
// import { hydrateRoot } from 'react-dom/client'
// import { StartClient } from '@tanstack/react-start/client'

import { StartClient } from '@tanstack/react-start/client'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
)
