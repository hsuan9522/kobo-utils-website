import FullCalendar from '@fullcalendar/react'
import { EventContentArg } from '@fullcalendar/core/index.js'
import multiMonthPlugin from '@fullcalendar/multimonth'
import {
    Text,
    Button,
    Box,
    FileUpload,
    FileUploadFileChangeDetails,
    HStack,
    VStack,
    Popover,
    Portal,
    Select,
    Grid,
    createListCollection,
    GridItem,
} from '@chakra-ui/react'
import { toaster } from '@/components/ui/toaster'
import { LuUpload } from 'react-icons/lu'
import initSqlJs from 'sql.js'
import { endLoading, startLoading } from '@/store/loading.slice'
import { formatStatistics } from '@/store/statistics.slice'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { dayjs } from '@/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { useEffect, useRef, useState } from 'react'

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
    const dispatch = useAppDispatch()
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

    const uploadFile = async (e: FileUploadFileChangeDetails) => {
        dispatch(startLoading())
        try {
            const SQL = await initSqlJs({
                locateFile: (file) => `https://sql.js.org/dist/${file}`,
            })
            const file = e.acceptedFiles[0]
            const arrayBuffer = await file.arrayBuffer()
            const unitArray = new Uint8Array(arrayBuffer)

            const db = new SQL.Database(unitArray)
            const res = db.exec(`
                SELECT Date, Title, Author,
                CAST(printf('%.1f', SUM(ReadingTime) / 60.0) AS REAL) AS TotalMinutesRead
                FROM Analytics
                GROUP BY Date, Title
                HAVING TotalMinutesRead >= 1;
            `)

            dispatch(formatStatistics(res[0].values))
        } catch (e) {
            toaster.create({
                title: `讀取失敗 (${e})`,
                type: 'error',
            })
        } finally {
            dispatch(endLoading())
        }
    }

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
                <FileUpload.Root
                    onFileChange={uploadFile}
                    accept={'.sqlite'}
                    flexDirection="row"
                    alignItems="center"
                >
                    <FileUpload.HiddenInput />
                    <FileUpload.Trigger asChild>
                        <HStack h="54px">
                            <Button variant="outline" size="sm" borderColor="gray.300">
                                <LuUpload /> Upload file
                            </Button>
                        </HStack>
                    </FileUpload.Trigger>
                    <FileUpload.List />
                </FileUpload.Root>
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
                <FullCalendar
                    ref={calendarRef}
                    initialDate={TODAY.subtract(1, 'month').startOf('month').format('YYYY-MM-DD')}
                    customButtons={{
                        my: { text: 'Jump' },
                    }}
                    headerToolbar={{
                        right: 'today prev,next my',
                        left: 'title',
                    }}
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
            <Box
                position="absolute"
                w={popoverOffset.width}
                h={popoverOffset.height}
                left={popoverOffset.left}
                top={popoverOffset.top}
            >
                <Popover.Root size="xs" closeOnInteractOutside={true}>
                    <Popover.Trigger asChild>
                        <Button
                            w="full"
                            h="full"
                            bg="#2c3e50"
                            fontWeight="normal"
                            fontFamily="Montserrat"
                        >
                            Jump
                        </Button>
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
