import { dayjs, getTimeFormat, isOneDayDiff } from '@/utils'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import initSqlJs from 'sql.js'
import { endLoading, startLoading } from './loading.slice'
import { RootState } from '.'

export interface StatisticsInfo {
    start: string
    title: string
    author: string
    minutes: number
    end: string // 因為 fullcalendar 的關係，需要多加一天
    backgroundColor: string
    borderColor: string
}

export interface BookInfo {
    title: string
    author: string
    totalMinutes: number
    lastDate: string
    days: number
    color: string
    border: string
}

interface State {
    data: StatisticsInfo[]
    books: BookInfo[]
}

const initialState: State = {
    data: [],
    books: []
}

export const formatStatistics = createAsyncThunk<State, initSqlJs.SqlValue[][], { state: RootState }>(
    'statistics/format',
    async (data: initSqlJs.SqlValue[][], { dispatch, rejectWithValue, getState }) => {
        const bgColors = getState().common.bgColors
        const bdrColors = getState().common.bdrColors
        try {
            dispatch(startLoading())
            let colorIndex = 0
            const bookInfo: Record<string, BookInfo> = {}

            const events = data
                .reduce((acc, curr) => {
                    const index = acc?.findLastIndex((item) => item.title === curr[1])

                    /**
                     * 0: Date
                     * 1: Title
                     * 2: Author
                     * 3: TotalMinutesRead
                     */
                    const current = {
                        start: curr[0] as string,
                        title: curr[1] as string,
                        author: curr[2] as string,
                        minutes: curr[3] as number,
                        end: curr[0] as string,
                        textColor: '#444444',
                    }

                    if (!bookInfo[current.title]) {
                        bookInfo[current.title] = {
                            title: current.title,
                            author: current.author,
                            totalMinutes: 0,
                            lastDate: current.end,
                            days: 0,
                            color: bgColors[colorIndex],
                            border: bdrColors[colorIndex],
                        }
                        colorIndex = ++colorIndex % bgColors.length
                    }
                    bookInfo[current.title].totalMinutes += current.minutes
                    bookInfo[current.title].lastDate = current.end
                    bookInfo[current.title].days += 1

                    if (index !== -1 && isOneDayDiff(acc[index].end, current.start)) {
                        acc[index] = {
                            ...acc[index],
                            minutes: acc[index].minutes + current.minutes,
                            end: current.start,
                        }
                    } else {
                        acc.push({
                            ...current,
                            backgroundColor: bookInfo[current.title].color,
                            borderColor: bookInfo[current.title].border,
                        })
                    }
                    return acc
                }, [] as StatisticsInfo[])
                .map((item) => ({
                    ...item,
                    end: dayjs(item.end).add(1, 'day').format('YYYY-MM-DD'),
                    timeText: getTimeFormat(item.minutes),
                }))

            const books: BookInfo[] = Object.values(bookInfo)

            return { data: events, books }
        } catch (e) {
            return rejectWithValue(e)
        } finally {
            dispatch(endLoading())
        }
    }
)

const statisticsSlice = createSlice({
    name: 'statistics',
    initialState,
    reducers: {
        // setStatistics: (state, action: PayloadAction<StatisticsInfo[]>) => {
        //     console.log('setStatistics', action.payload)
        //     state.data = action.payload
        // },
    },
    extraReducers: (builder) => {
        builder
            .addCase(formatStatistics.fulfilled, (state, action) => {
                state.data = action.payload.data
                state.books = action.payload.books
            })
            .addCase(formatStatistics.rejected, (state) => {
                state.data = []
                state.books = []
            })
    },
})

// export const { setStatistics } = statisticsSlice.actions
export default statisticsSlice.reducer
