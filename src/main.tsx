import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AssessmentFlow } from './features/assessment/AssessmentFlow';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AssessmentFlow
      employerDomain="shypp.io"
      employerName="Shypp"
      roleTitle="Product Designer"
      demo
      onSubmit={(p) => console.log("submitted", p)}
    />
  </StrictMode>,
);
