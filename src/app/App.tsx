import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { appRouter } from './router';
import '../styles/global.css';
import '../components/ui/ui.css';

function App() {
  return (
    <AppProviders>
      <RouterProvider router={appRouter} />
    </AppProviders>
  );
}

export default App;
