import { dayjs, getTimeFormat, isOneDayDiff } from '@/utils'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import initSqlJs from 'sql.js'
import { endLoading, startLoading } from './loading.slice'
import { RootState } from '.'
import { cloneDeep } from 'lodash-es'
import { NoteType } from '@/types/enums'

export interface StatisticsInfo {
    start: string
    title: string
    author: string
    minutes: number
    end: string // 因為 fullcalendar 的關係，需要多加一天
    backgroundColor: string
    borderColor: string
}

export interface NoteInfo {
    text: string
    annotation: string
    date: string
    type: NoteType
    isoDate: string
}

export interface BookInfo {
    title: string
    author: string
    totalMinutes: number
    startDate: string
    lastDate: string
    days: number
    color: string
    border: string
    data: { date: string; minutes: number }[]
    notes: NoteInfo[]
}

interface State {
    data: StatisticsInfo[]
    books: BookInfo[]
    bookIdMap: Record<string, number>
}

const initialState: State = {
    data: [],
    books: [],
    bookIdMap: {},
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

                    /** sqlValue 陣列結構
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
                            startDate: current.start,
                            lastDate: current.end,
                            days: 0,
                            color: bgColors[colorIndex],
                            border: bdrColors[colorIndex],
                            data: [],
                            notes: [],
                        }
                        colorIndex = ++colorIndex % bgColors.length
                    }
                    bookInfo[current.title].totalMinutes += current.minutes
                    bookInfo[current.title].lastDate = current.end
                    bookInfo[current.title].days += 1
                    bookInfo[current.title].data.push({
                        date: current.start,
                        minutes: current.minutes,
                    })

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
            const bookIdMap: Record<string, number> = books.reduce((acc, curr, idx) => {
                acc[curr['title']] = idx
                return acc
            }, {} as Record<string, number>)

            return { data: events, books, bookIdMap }
        } catch (e) {
            return rejectWithValue(e)
        } finally {
            dispatch(endLoading())
        }
    }
)

export const syncNotes = createAsyncThunk<BookInfo[], initSqlJs.SqlValue[][], { state: RootState }>(
    'statistics/syncNotes',
    async (data: initSqlJs.SqlValue[][], { dispatch, rejectWithValue, getState }) => {
        const books = cloneDeep(getState().statistics.books) //因為 state 不能隨意變更，所以要先 deepclone
        const bookIdMap = getState().statistics.bookIdMap

        try {
            dispatch(startLoading())

            /** sqlValue 陣列結構
             * 0: Title
             * 1: DateCreated( ISO 8601 時間格式)
             * 2: Text(劃線內容)
             * 3: Annotation(筆記內容)
             * 4: Type
             * 5: DateString(1 轉換為當地日期字串)
             */
            data.forEach((item) => {
                const title = item[0] as string
                const id = bookIdMap[title]

                if (books[id]) {
                    if (!books[id].notes) {
                        books[id].notes = []
                    }

                    books[id].notes.push({
                        text: item[2] as string,
                        annotation: item[3] as string,
                        date: item[5] as string,
                        type: item[4] as NoteType,
                        isoDate: item[1] as string,
                    })
                }
            })
            return books
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
                state.bookIdMap = action.payload.bookIdMap
            })
            .addCase(formatStatistics.rejected, (state) => {
                state.data = []
                state.books = []
                state.bookIdMap = {}
            })
            .addCase(syncNotes.fulfilled, (state, action) => {
                state.books = action.payload
            })
    },
})

// export const { setStatistics } = statisticsSlice.actions
export default statisticsSlice.reducer
