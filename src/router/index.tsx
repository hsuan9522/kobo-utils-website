import { LuCalendarDays, LuNotebook, LuHouse } from 'react-icons/lu'
import { createBrowserRouter } from 'react-router'
import BaseLayout from '@/layout/base'
import Calendar from '@/pages/calendar'
import Home from '@/pages/home'
import Notes from '@/pages/notes'

export const routerInfo = [
    { label: 'Home', path: '/', icon: LuHouse, element: Home },
    { label: 'Calendar', path: '/calendar', icon: LuCalendarDays, element: Calendar },
    { label: 'Notes', path: '/notes', icon: LuNotebook, element: Notes },
]

const router = createBrowserRouter([
    {
        path: '/',
        Component: BaseLayout,
        children: routerInfo.map((item) => ({
            path: item.path,
            element: <item.element />,
        })),
    },
])

export default router
