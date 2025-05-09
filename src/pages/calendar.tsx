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
import { setStatistics } from '@/store/statistics.slice'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { dayjs, getTimeFormat, isOneDayDiff } from '@/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { StatisticsInfo } from '@/store/statistics.slice'
import { useEffect, useRef } from 'react'

const Calendar = () => {
    const dispatch = useAppDispatch()
    const { data: events } = useAppSelector((state) => state.statistics)
    //               ['orange',  'yellow',  'green',   'blue',    'cyan',    'purple',  'red']
    const bgColors = ['#F6D7C8', '#BAE5D5', '#E2D0EB', '#F8EDD1', '#C4DCF2', '#FBD3D7', '#D8E7F5']
    const bdrColors = ['#d15700', '#0a5049', '#542a87', '#cb9800', '#183c8c', '#ab1f1f', '#0277a3']

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

            let colorIndex = 0
            const bookColors: Record<string, { color: string; border: string }> = {}

            /**
             * 0: Date
             * 1: Title
             * 2: Author
             * 3: TotalMinutesRead
             */
            const data = res[0].values
                .reduce((acc, curr) => {
                    const index = acc?.findLastIndex((item) => item.title === curr[1])

                    const current = {
                        start: curr[0] as string,
                        title: curr[1] as string,
                        author: curr[2] as string,
                        minutes: curr[3] as number,
                        end: curr[0] as string,
                        textColor: '#444444',
                    }

                    if (index !== -1 && isOneDayDiff(acc[index].end, current.start)) {
                        acc[index] = {
                            ...acc[index],
                            minutes: acc[index].minutes + current.minutes,
                            end: current.start,
                        }
                    } else {
                        if (!bookColors[current.title]) {
                            bookColors[current.title] = {
                                color: bgColors[colorIndex],
                                border: bdrColors[colorIndex],
                            }
                            colorIndex = ++colorIndex % bgColors.length
                        }

                        acc.push({
                            ...current,
                            backgroundColor: bookColors[current.title].color,
                            borderColor: bookColors[current.title].border,
                        })
                    }
                    return acc
                }, [] as StatisticsInfo[])
                .map((item) => ({
                    ...item,
                    end: dayjs(item.end).add(1, 'day').format('YYYY-MM-DD'),
                    timeText: getTimeFormat(item.minutes),
                }))

            dispatch(setStatistics(data))
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
