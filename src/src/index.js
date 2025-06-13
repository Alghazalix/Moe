import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // استيراد مكون App الخاص بكما

// العثور على العنصر الجذر (root) في ملف public/index.html
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

// عرض مكون App داخل العنصر الجذر
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
