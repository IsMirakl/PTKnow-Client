import AppRouter from './routes/AppRouter.tsx';
import 'react-toastify/dist/ReactToastify.css';

import './styles/global.css';

function App() {
  return (
    <div className="app">
      <AppRouter />
    </div>
  );
}

export default App;
