import { Outlet } from 'react-router'
import { Flex } from '@chakra-ui/react'
import { Menu } from '@/components/menu'
import { HBreadcrumb } from '@/components/breadcrumb'

const BaseLayout = () => {
    return (
        <Flex padding={{ md: '8', base: '4' }} h="full" w="full" flexDir="column">
            <HBreadcrumb />
            <Outlet />
            <Menu />
        </Flex>
    )
}

export default BaseLayout
