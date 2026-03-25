import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './utils/installAuthFetch';
import reportWebVitals from './reportWebVitals';

const migrateLegacyHashUrl = () => {
  const { hash, pathname, search } = window.location;

  if (!hash || hash === '#') {
    return;
  }

  if (hash.startsWith('#/')) {
    const legacyPath = hash.slice(1);
    window.history.replaceState(null, '', legacyPath);
    return;
  }

  if (hash.startsWith('#?')) {
    const mergedParams = new URLSearchParams(search);
    const legacyParams = new URLSearchParams(hash.slice(2));

    legacyParams.forEach((value, key) => {
      mergedParams.set(key, value);
    });

    const nextSearch = mergedParams.toString();
    window.history.replaceState(null, '', `${pathname}${nextSearch ? `?${nextSearch}` : ''}`);
  }
};

migrateLegacyHashUrl();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
