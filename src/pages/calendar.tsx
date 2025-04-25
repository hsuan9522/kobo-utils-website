import FullCalendar from '@fullcalendar/react'
import { EventContentArg } from '@fullcalendar/core/index.js'
import multiMonthPlugin from '@fullcalendar/multimonth'
import dayjs from 'dayjs'
import { Flex, Text, Group, Input, Button, Box, Icon } from '@chakra-ui/react'
import { useState } from 'react'
import { LuX } from 'react-icons/lu'
import initSqlJs from 'sql.js'

const Calendar = () => {
    const [value, setValue] = useState('')
    const [loading, setLoading] = useState(false)

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
        console.log(eventInfo)
        return (
            <>
                <Text textStyle="xs" lineHeight="1" p="2px" truncate>
                    {eventInfo.event.title}
                </Text>
            </>
        )
    }

    const submit = async () => {
        try {
            const SQL = await initSqlJs({
                locateFile: () => value,
            })
            const db = new SQL.Database()
            const stmt = db.prepare('SELECT * FROM Bookmark')

            // Bind values to the parameters and fetch the results of the query
            // const result = stmt.getAsObject({ ':aval': 1, ':bval': 'world' })
            // console.log(stmt) // Will print {a:1, b:'world'}
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <Flex
            direction="column"
            align="center"
            justify="start"
            py="4"
            gap="8"
            height="90%"
            px={{ md: '20' }}
            mx={{ md: '20' }}
        >
            <Box position="relative" width={{ md: '60%', base: '100%' }}>
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
            </Box>
            <FullCalendar
                height={'100%'}
                aspectRatio={1.25}
                contentHeight={'auto'}
                plugins={[multiMonthPlugin]}
                initialView="multiMonthTwoMonth"
                multiMonthMaxColumns={2}
                views={calendarViews}
                events={events}
                eventContent={renderEventContent}
            />
        </Flex>
    )
}

export default Calendar
