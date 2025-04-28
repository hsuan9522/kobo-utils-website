import { Spinner as ChakraSpinner, AbsoluteCenter } from '@chakra-ui/react'
export const Spinner = () => {
    return (
        <AbsoluteCenter w="full" h="full" axis="both" zIndex="9999" bg="gray.500/75">
            <ChakraSpinner size="lg" />
        </AbsoluteCenter>
    )
}
