import { Heading, Separator, Center, VStack, IconButton } from '@chakra-ui/react'
import { LuHouse } from 'react-icons/lu'
import { useNavigate } from 'react-router'

const Error = () => {
    const navigate = useNavigate()

    return (
        <VStack w="full" h="full" gap="4" justifyContent="center">
            <Center gap="4" color="gray.700">
                <Heading size="2xl">404</Heading>
                <Separator orientation="vertical" height="8" borderColor="gray.300" />
                <Heading size="md" fontWeight="normal">
                    This page could not be found.
                </Heading>
            </Center>
            <IconButton aria-label="home" onClick={() => navigate('/')} bg="gray.700">
                <LuHouse />
            </IconButton>
        </VStack>
    )
}

export default Error
