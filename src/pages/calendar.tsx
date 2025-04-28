import FullCalendar from '@fullcalendar/react'
import { EventContentArg } from '@fullcalendar/core/index.js'
import multiMonthPlugin from '@fullcalendar/multimonth'
import dayjs from 'dayjs'
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
import { useState } from 'react'
import { LuUpload } from 'react-icons/lu'
import initSqlJs, { Database } from 'sql.js'
import { endLoading, startLoading } from '@/store/loading.slice'
import { useAppDispatch } from '@/hooks/useRedux'

const Calendar = () => {
    const [database, setDatabase] = useState<Database | null>(null)
    const dispatch = useAppDispatch()

    const events = [
        {
            title: '1到時候會是中文字啊',
            date: dayjs().format('YYYY-MM-DD'),
        },
        {
            title: '2Meeting1',
            date: dayjs().format('YYYY-MM-DD'),
        },
        {
            title: '3到時候會是中文字啊',
            date: dayjs().format('YYYY-MM-DD'),
        },
        {
            title: '4Meeting1',
            date: dayjs().format('YYYY-MM-DD'),
        },
        {
            title: '5Meeting1',
            date: dayjs().format('YYYY-MM-DD'),
        },
    ]

    const calendarViews = {
        multiMonthTwoMonth: {
            type: 'multiMonth',
            duration: { months: 2 },
        },
    }

    const renderEventContent = (eventInfo: EventContentArg) => {
        return (
            <>
                <Text textStyle="xs" lineHeight="1" p="2px" truncate>
                    {eventInfo.event.title}
                </Text>
            </>
        )
    }

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
            setDatabase(db)
            const res = db.exec(`
                SELECT Date, Title, Author,
                CAST(printf('%.1f', SUM(ReadingTime) / 60.0) AS REAL) AS TotalMinutesRead
                FROM Analytics
                GROUP BY Date, Title
                HAVING TotalMinutesRead >= 1;
            `)
        } catch (e) {
            toaster.create({
                title: `讀取失敗 (${e})`,
                type: 'error',
            })
        } finally {
            dispatch(endLoading())
        }
    }

    return (
        <VStack py="4" gap="4" flexGrow="1" overflow="hidden" px={{ xl: '20' }} mx={{ xl: '20' }}>
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
                    initialDate={dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')}
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
