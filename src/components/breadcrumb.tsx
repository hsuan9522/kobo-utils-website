import { Breadcrumb, Bleed, Box } from '@chakra-ui/react'
import { LiaSlashSolid } from 'react-icons/lia'
import { LuHouse } from 'react-icons/lu'

export const HBreadcrumb = () => {
    return (
        <Box pb="10">
            <Bleed>
                <Breadcrumb.Root>
                    <Breadcrumb.List>
                        <Breadcrumb.Item>
                            <LuHouse />
                        </Breadcrumb.Item>
                        <Breadcrumb.Separator>
                            <LiaSlashSolid />
                        </Breadcrumb.Separator>
                        <Breadcrumb.Item>
                            <Breadcrumb.Link href="pathName">Home</Breadcrumb.Link>
                        </Breadcrumb.Item>
                    </Breadcrumb.List>
                </Breadcrumb.Root>
            </Bleed>
        </Box>
    )
}
