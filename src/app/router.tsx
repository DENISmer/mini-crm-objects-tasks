import { createBrowserRouter } from 'react-router'

import { RequireAuth, RequireRole } from '@/features/auth'
import { RouteErrorPage } from '@/pages/error/RouteErrorPage'
import { HomeRedirect } from '@/pages/home/HomeRedirect'
import { LoginPage } from '@/pages/login/LoginPage'
import { MyTasksPage } from '@/pages/my-tasks/MyTasksPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { ObjectPage } from '@/pages/object/ObjectPage'
import { ObjectsPage } from '@/pages/objects/ObjectsPage'
import { TaskPage } from '@/pages/task/TaskPage'
import { AppLayout } from '@/widgets/app-layout'

export const router = createBrowserRouter([
  {
    // Корневой errorElement: ошибка в любом месте дерева показывает RouteErrorPage, а не белый экран.
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                // Ошибки внутри страниц ловим здесь, чтобы шапка и навигация оставались на месте.
                errorElement: <RouteErrorPage />,
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
        ],
      },
    ],
  },
])
