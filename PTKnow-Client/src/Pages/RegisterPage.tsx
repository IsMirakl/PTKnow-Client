import { Navigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  return <Navigate to="/auth?mode=register" replace />;
};

export default RegisterPage;
