import FullCalendar from '@fullcalendar/react'
import { EventClickArg, EventContentArg } from '@fullcalendar/core/index.js'
import multiMonthPlugin from '@fullcalendar/multimonth'
import {
    Text,
    Button,
    Box,
    VStack,
    Popover,
    Portal,
    Select,
    Grid,
    createListCollection,
    GridItem,
} from '@chakra-ui/react'

import { useAppSelector } from '@/hooks/useRedux'
import { dayjs } from '@/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { useEffect, useRef, useState } from 'react'
import { BookDrawer } from '@/components/bookDrawer'
import { UploadField } from '@/components/uploadField'

const TODAY = dayjs()
const currentYear = TODAY.year().toString()
const currentMonth = TODAY.month().toString()

const years = createListCollection({
    items: Array.from({ length: 25 }, (_, i) => {
        const year = TODAY.subtract(i, 'year').year()
        return { label: year, value: year.toString() }
    }),
})

const months = createListCollection({
    items: Array.from({ length: 12 }, (_, i) => {
        return { label: TODAY.month(i).format('MMM'), value: i.toString() }
    }),
})

const Calendar = () => {
    const { data: events } = useAppSelector((state) => state.statistics)

    const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null)

    const calendarViews = {
        multiMonthTwoMonth: {
            type: 'multiMonth',
            duration: { months: 2 },
        },
    }

    const [selectYear, setSelectYear] = useState([currentYear])
    const [selectMonth, setSelectMonth] = useState([currentMonth])
    const isInitial = useRef(true)
    const [openDrawer, setOpenDrawer] = useState(false)
    const [selectedTitle, setSelectedTitle] = useState('')

    useEffect(() => {
        if (calendarRef.current && events.length) {
            const lastIndex = events.length - 1
            const lastReadDate = events[lastIndex].end
            const showDate = dayjs(lastReadDate)
                .subtract(1, 'month')
                .startOf('month')
                .format('YYYY-MM-DD')
            calendarRef.current.getApi().gotoDate(showDate)
        }
    }, [events])

    useEffect(() => {
        getJumpPosition()
    }, [calendarRef])

    useEffect(() => {
        if (isInitial.current) {
            isInitial.current = false
            return
        }
        const selectDate = dayjs(`${selectYear[0]}-${+selectMonth[0] + 1}-1`)
            .subtract(1, 'month')
            .format('YYYY-MM-DD')
        calendarRef.current?.getApi().gotoDate(selectDate)
    }, [selectYear, selectMonth])

    const renderEventContent = (eventInfo: EventContentArg) => {
        // 會造成 flushSync was called from inside a lifecycle method...
        return (
            <Tooltip
                content={`${eventInfo.event.extendedProps.author}《 ${eventInfo.event.title} 》 / ${eventInfo.event.extendedProps.timeText}`}
                showArrow
                openDelay={100}
                positioning={{ offset: { mainAxis: 6 } }}
            >
                <Text textStyle="2xs" lineHeight="1" p="2px" truncate cursor={'default'}>
                    {`${eventInfo.event.title}(${eventInfo.event.extendedProps.timeText})`}
                </Text>
            </Tooltip>
        )
    }

    const [popoverOffset, setPopoverOffset] = useState({ width: 0, height: 0, left: 0, top: 0 })
    const getJumpPosition = () => {
        const el = document.querySelector('[title="Jump"]')?.getBoundingClientRect()
        if (!el) return

        setPopoverOffset({
            width: el.width,
            height: el.height,
            left: el.left,
            top: el.top,
        })
    }

    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const handleJump = () => {
        setIsPopoverOpen(!isPopoverOpen)
    }

    const eventClick = (el: EventClickArg) => {
        setOpenDrawer(true)
        setSelectedTitle(el.event.title)
    }

    return (
        <VStack
            py={{ xl: '4', sm: '0' }}
            gap="4"
            flexGrow="1"
            overflow="hidden"
            px={{ xl: '20' }}
            mx={{ xl: '20' }}
        >
            <Box w="full">
                <UploadField></UploadField>
                {selectedTitle && (
                    <BookDrawer
                        open={openDrawer}
                        title={selectedTitle}
                        onClose={() => {
                            setOpenDrawer(false)
                        }}
                    />
                )}
                {/* <ColorPlatte /> */}
            </Box>
            {/* <Box position="relative" w={{ md: '60%', base: '100%' }}>
                {value && (
                    <Icon
                        position="absolute"
                        right="84px"
                        top="50%"
                        translate="0 -50%"
                        color="gray.400"
                        zIndex="1"
                        onClick={() => setValue('')}
                    >
                        <LuX />
                    </Icon>
                )}
                <Group attached w="full">
                    <Input
                        value={value}
                        flex="1"
                        pr="6"
                        borderColor="gray.300"
                        placeholder="Enter your url"
                        onChange={(e) => {
                            setValue(e.currentTarget.value)
                        }}
                    />
                    <Button onClick={submit}>Submit</Button>
                </Group>
            </Box> */}
            <Box w="full" h="full" flexGrow={1} overflow="hidden" padding={1}>
                <Box overflow="auto" w="full" h="full">
                    <FullCalendar
                        ref={calendarRef}
                        initialDate={TODAY.subtract(1, 'month')
                            .startOf('month')
                            .format('YYYY-MM-DD')}
                        customButtons={{
                            my: { text: 'Jump', click: handleJump },
                        }}
                        headerToolbar={{
                            right: 'today prev,next my',
                            left: 'title',
                        }}
                        eventClick={eventClick}
                        titleFormat={{ month: 'short', year: 'numeric' }}
                        aspectRatio={1.35}
                        contentHeight={'auto'}
                        plugins={[multiMonthPlugin]}
                        showNonCurrentDates={false}
                        initialView="multiMonthTwoMonth"
                        multiMonthMaxColumns={2}
                        views={calendarViews}
                        events={events}
                        eventContent={renderEventContent}
                    />
                </Box>
            </Box>
            <Box
                position="absolute"
                w="1px"
                h={popoverOffset.height}
                left={popoverOffset.left}
                top={popoverOffset.top}
            >
                <Popover.Root
                    size="xs"
                    open={isPopoverOpen}
                    onInteractOutside={() => {
                        setIsPopoverOpen(false)
                    }}
                >
                    <Popover.Trigger asChild>
                        <Button zIndex={-1}></Button>
                    </Popover.Trigger>
                    <Portal>
                        <Popover.Positioner>
                            <Popover.Content>
                                <Popover.Arrow />
                                <Popover.Body>
                                    <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                                        <GridItem colSpan={1}>
                                            <Select.Root
                                                collection={months}
                                                size="sm"
                                                value={selectMonth}
                                                onValueChange={(details) =>
                                                    setSelectMonth(details.value)
                                                }
                                            >
                                                <Select.HiddenSelect />
                                                <Select.Control>
                                                    <Select.Trigger>
                                                        <Select.ValueText placeholder="Month" />
                                                    </Select.Trigger>
                                                    <Select.IndicatorGroup>
                                                        <Select.Indicator />
                                                    </Select.IndicatorGroup>
                                                </Select.Control>
                                                <Select.Positioner>
                                                    <Select.Content width="full">
                                                        {months.items.map((item) => (
                                                            <Select.Item
                                                                item={item}
                                                                key={item.value}
                                                            >
                                                                {item.label}
                                                                <Select.ItemIndicator />
                                                            </Select.Item>
                                                        ))}
                                                    </Select.Content>
                                                </Select.Positioner>
                                            </Select.Root>
                                        </GridItem>
                                        <GridItem colSpan={2}>
                                            <Select.Root
                                                collection={years}
                                                size="sm"
                                                value={selectYear}
                                                onValueChange={(details) =>
                                                    setSelectYear(details.value)
                                                }
                                            >
                                                <Select.HiddenSelect />
                                                <Select.Control>
                                                    <Select.Trigger>
                                                        <Select.ValueText placeholder="Year" />
                                                    </Select.Trigger>
                                                    <Select.IndicatorGroup>
                                                        <Select.Indicator />
                                                    </Select.IndicatorGroup>
                                                </Select.Control>
                                                <Select.Positioner>
                                                    <Select.Content width="full">
                                                        {years.items.map((item) => (
                                                            <Select.Item
                                                                item={item}
                                                                key={item.value}
                                                            >
                                                                {item.label}
                                                                <Select.ItemIndicator />
                                                            </Select.Item>
                                                        ))}
                                                    </Select.Content>
                                                </Select.Positioner>
                                            </Select.Root>
                                        </GridItem>
                                    </Grid>
                                </Popover.Body>
                            </Popover.Content>
                        </Popover.Positioner>
                    </Portal>
                </Popover.Root>
            </Box>
        </VStack>
    )
}

export default Calendar
