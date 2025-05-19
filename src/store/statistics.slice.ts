import { dayjs, getTimeFormat, isOneDayDiff } from '@/utils'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import initSqlJs from 'sql.js'
import { endLoading, startLoading } from './loading.slice'

const bgColors = ['#F6D7C8', '#BAE5D5', '#E2D0EB', '#F8EDD1', '#C4DCF2', '#FBD3D7', '#D8E7F5']
const bdrColors = ['#d15700', '#0a5049', '#542a87', '#cb9800', '#183c8c', '#ab1f1f', '#0277a3']
export interface StatisticsInfo {
    start: string
    title: string
    author: string
    minutes: number
    end: string
    backgroundColor: string
    borderColor: string
}

interface State {
    data: StatisticsInfo[]
}

const initialState: State = {
    data: [],
}

export const formatStatistics = createAsyncThunk(
    'statistics/format',
    async (data: initSqlJs.SqlValue[][], { dispatch, rejectWithValue }) => {
        try {
            dispatch(startLoading())
            let colorIndex = 0
            const bookColors: Record<string, { color: string; border: string }> = {}

            return data
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
                state.data = action.payload
            })
            .addCase(formatStatistics.rejected, (state) => {
                state.data = []
            })
    },
})

// export const { setStatistics } = statisticsSlice.actions
export default statisticsSlice.reducer
