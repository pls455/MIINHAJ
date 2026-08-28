import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Home,Branches,Subjects,Resources,Foundation,Solutions } from '../pages/Public';
import { Tools } from '../pages/Tools';
import { AI } from '../pages/AI';
import { AdminGuard } from './AdminGuard';
import { AdminLogin } from '../pages/admin/Login';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminManager } from '../pages/admin/Manager';
const router=createBrowserRouter([{path:'/',element:<Layout/>,children:[{index:true,element:<Home/>},{path:'subjects',element:<Subjects/>},{path:'resources',element:<Resources/>},{path:'foundation',element:<Foundation/>},{path:'tools',element:<Tools/>},{path:'solutions',element:<Solutions/>},{path:'ai',element:<AI/>},{path:'suggest',element:<Placeholder title="الاقتراحات"/>},{path:'report-problem',element:<Placeholder title="الإبلاغ عن مشكلة"/>},{path:'admin/login',element:<AdminLogin/>},{element:<AdminGuard/>,children:[{path:'admin',element:<AdminDashboard/>},{path:'admin/:domain',element:<AdminManager/>}]}]}]);
function Placeholder({title}:{title:string}){return <section className="narrow"><h1>{title}</h1><p>هذا القسم قيد النقل المعماري، بدون تعطيل بقية المنصة.</p></section>}
export function App(){return <RouterProvider router={router}/>}
