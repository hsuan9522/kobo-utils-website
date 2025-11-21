import { Text } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'

export const TextTyping = ({
    text,
    animation = false,
    animationDuration = 4,
}: {
    text: string
    animation?: boolean
    animationDuration?: number
}) => {
    const textRef = useRef<HTMLDivElement>(null)
    const charCount = text.length

    useEffect(() => {
        if (textRef.current && animation) {
            const width = textRef.current.scrollWidth
            textRef.current.style.setProperty('--text-width', `${width}px`)
        }
    }, [text, animation])

    return (
        <>
            <style>
                {`
                .typewriter {
                    font-family: monospace;
                    overflow: hidden;
                    border-right: 0.15em solid orange;
                    white-space: nowrap;
                    margin: 0 auto;
                    letter-spacing: 0.15em;
                    animation:
                        typing ${animationDuration}s steps(${charCount}, end) 0.1s forwards,
                        blink-caret 0.5s step-end 0.1s infinite;
                    width: 0;
                }

                @keyframes typing {
                    from {
                        width: 0;
                    }
                    to {
                        width: var(--text-width, 250px);
                    }
                }

                /* The typewriter cursor effect */
                @keyframes blink-caret {
                    from,
                    to {
                        border-color: transparent;
                    }
                    50% {
                        border-color: orange;
                    }
                }
            `}
            </style>
            <Text ref={textRef} className={animation ? 'typewriter' : ''}>
                {text}
            </Text>
        </>
    )
}
