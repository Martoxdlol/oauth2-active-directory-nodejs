import './App.css';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"
import Login from './views/login';
import Landing from './views/landing';
import ResetPassword from './views/reset-password';
import Page404 from './views/Page404';

function App() {
  return (
    <main>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Page404 />} />
        </Routes>
      </BrowserRouter>

    </main>
  );
}

export default App;
