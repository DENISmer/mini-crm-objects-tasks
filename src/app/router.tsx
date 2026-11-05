import { createBrowserRouter } from 'react-router'

import { RequireAuth, RequireRole } from '@/features/auth'
import { HomeRedirect } from '@/pages/home/HomeRedirect'
import { LoginPage } from '@/pages/login/LoginPage'
import { MyTasksPage } from '@/pages/my-tasks/MyTasksPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { ObjectPage } from '@/pages/object/ObjectPage'
import { ObjectsPage } from '@/pages/objects/ObjectsPage'
import { TaskPage } from '@/pages/task/TaskPage'
import { AppLayout } from '@/widgets/app-layout'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: 'objects', element: <ObjectsPage /> },
          { path: 'objects/:objectId', element: <ObjectPage /> },
          { path: 'tasks/:taskId', element: <TaskPage /> },
          {
            path: 'my-tasks',
            element: (
              <RequireRole role="executor">
                <MyTasksPage />
              </RequireRole>
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
