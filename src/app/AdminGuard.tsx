import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loading } from '../components/Layout';
export function AdminGuard(){const {user,admin,loading}=useAuth();if(loading)return <Loading/>;if(!user)return <Navigate to="/admin/login" replace/>;if(!admin?.active)return <Navigate to="/" replace/>;return <Outlet/>;}
