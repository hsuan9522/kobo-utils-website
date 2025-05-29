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
} from '@chakra-ui/react'
import { toaster } from '@/components/ui/toaster'
import { LuUpload } from 'react-icons/lu'
import initSqlJs from 'sql.js'
import { endLoading, startLoading } from '@/store/loading.slice'
import { formatStatistics } from '@/store/statistics.slice'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { dayjs } from '@/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { useEffect, useRef } from 'react'

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
            <Box w="full" h="full" flexGrow={1} overflow="hidden">
                <FullCalendar
                    ref={calendarRef}
                    initialDate={dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')}
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
        </VStack>
    )
}

export default Calendar
