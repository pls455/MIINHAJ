import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Home, Subjects, Resources, Foundation, Solutions } from '../pages/Public';
import { Tools } from '../pages/Tools';
import { AI } from '../pages/AI';
import { About } from '../pages/About';
import { SuggestPage, ReportPage } from '../pages/Submissions';
import { AdminGuard } from './AdminGuard';
import { AdminLogin } from '../pages/admin/Login';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminManager } from '../pages/admin/Manager';

const router = createBrowserRouter([{
  path: '/', element: <Layout/>, children: [
    { index: true, element: <Home/> },
    { path: 'subjects', element: <Subjects/> },
    { path: 'resources', element: <Resources/> },
    { path: 'foundation', element: <Foundation/> },
    { path: 'tools', element: <Tools/> },
    { path: 'solutions', element: <Solutions/> },
    { path: 'ai', element: <AI/> },
    { path: 'about', element: <About/> },
    { path: 'suggest', element: <SuggestPage/> },
    { path: 'report-problem', element: <ReportPage/> },
    { path: 'admin/login', element: <AdminLogin/> },
    { element: <AdminGuard/>, children: [
      { path: 'admin', element: <AdminDashboard/> },
      { path: 'admin/:domain', element: <AdminManager/> },
    ] },
  ],
}]);

export function App() { return <RouterProvider router={router}/>; }
