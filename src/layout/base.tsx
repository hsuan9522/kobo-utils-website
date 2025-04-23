import { Outlet } from 'react-router'
import { Box } from '@chakra-ui/react'
import { Menu } from '@/components/menu'
import { HBreadcrumb } from '@/components/breadcrumb'

const BaseLayout = () => {
    return (
        <Box padding="10">
            <HBreadcrumb />
            <Outlet />
            <Menu />
        </Box>
    )
}

export default BaseLayout
