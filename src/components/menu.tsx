import { ActionBar, Button, Portal, For } from '@chakra-ui/react'
import { Fragment } from 'react'
import { routerInfo } from '@/router'
import { useLocation, useNavigate } from 'react-router'

export const Menu = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const pathName = location.pathname

    const showMenu = routerInfo.filter((item) => item.path !== pathName)

    return (
        <ActionBar.Root open={true} closeOnInteractOutside={false}>
            <Portal>
                <ActionBar.Positioner>
                    <ActionBar.Content>
                        <For each={showMenu}>
                            {(item, idx) => (
                                <Fragment key={item.label}>
                                    <Button
                                        key={item.label}
                                        variant="outline"
                                        left-icon
                                        size="sm"
                                        onClick={() => navigate(item.path)}
                                    >
                                        <item.icon />
                                        {item.label}
                                    </Button>
                                    {idx !== showMenu.length - 1 && <ActionBar.Separator />}
                                </Fragment>
                            )}
                        </For>
                    </ActionBar.Content>
                </ActionBar.Positioner>
            </Portal>
        </ActionBar.Root>
    )
}
